const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');
const { promisify } = require('util');

// models
const User = require('../../models/userModel');
const ReferList = require('../../models/referListModel');

// utils
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

// validations
const {
  signupSchema,
  loginSchema,
} = require('../../validations/authValidator');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res, redirect = false) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  // for https only
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;
  if (redirect) {
    res.redirect(process.env.REACT_URL + `?auth=oauth&token=${token}`);
  } else {
    res.status(statusCode).json({
      status: 'success',
      token,
      user,
    });
  }
};

const signup = catchAsync(async (req, res, next) => {
  const { error } = signupSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(
      new AppError(`EmailId Already Exists with MOL : ${existingUser.MOL}`, 400)
    );
  }

  if (req.body.referId) {
    const referedBy = await User.findOne({ uniqueReferLink: req.body.referId });
    if (referedBy) {
      const uniqueReferLink = randomstring.generate({
        length: 10,
        charset: ['alphabetic', 'numeric'],
      });

      const newUser = await User.create({
        ...req.body,
        MOL: 'EMAIL',
        uniqueReferLink,
      });
      await ReferList.create({
        referedBy: referedBy._id,
        referedTo: newUser._id,
      });

      createAndSendToken(newUser, 201, res);
    } else {
      return next(new AppError('Refer link is wrong', 400));
    }
  } else {
    return next(new AppError('No refer link provided', 400));
  }
});

const login = catchAsync(async (req, res, next) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { email, password } = req.body;

  // 1) check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) if everything ok , send token to client
  createAndSendToken(user, 200, res);
});

const protect = catchAsync(async (req, res, next) => {
  try {
    // 1) Getting token and check if it exists
    let token = '';
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please login to get access', 401)
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);

    // 3) Check if token is already expired
    if (decoded.exp * 1000 < Date.now()) {
      return next(new AppError('Token is expired. Please login again.', 401));
    }

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return next(
        new AppError('The token belonging to this user no longer exists', 401)
      );
    }

    // 4) Check if user changed password after token was issued
    if (!freshUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please login again.', 401)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    next();
  } catch (error) {
    return next(new AppError(error.message, 401));
  }
});

const checkReferId = catchAsync(async (req, res, next) => {
  const { referId } = req.query;
  if (!referId) {
    return next(new AppError('referId is required', 400));
  }

  const existingUser = await User.findOne({ uniqueReferLink: referId });

  res.status(200).json({
    status: 'success',
    isValid: existingUser ? true : false,
  });
});

module.exports = {
  createAndSendToken,
  signup,
  login,
  protect,
  checkReferId,
};
