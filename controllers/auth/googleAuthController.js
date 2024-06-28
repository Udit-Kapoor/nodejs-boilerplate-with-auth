const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const User = require('../../models/userModel');
const ReferList = require('../../models/referListModel');
const randomstring = require('randomstring');
const { google } = require('googleapis');
const { createAndSendToken } = require('./authController');
const { default: axios } = require('axios');
const {
  readRedisCache,
  setRedisCache,
} = require('../../middlewares/redisMiddleware');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

const googleUrlGenerator = catchAsync((req, res, next) => {
  // Access scopes for read-only Drive activity.
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'online',
    /** Pass in the scopes array defined above.
     * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: scopes,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true,
  });

  res.status(200).json({ success: 'success', authorizationUrl });
});

const authWithGoogle = catchAsync(async (req, res, next) => {
  const { code, referId } = req.query;
  if (!code) {
    return next(new AppError('Google Code is required', 400));
  }
  let googleUser = await readRedisCache(code);
  if (!googleUser) {
    let { tokens } = await oauth2Client.getToken(code);
    if (!tokens) {
      return next(new AppError('Invalid Code', 400));
    }

    //Get user details and unique identifier from Google
    googleUser = await getGoogleUser(tokens.id_token, tokens.access_token);
    //set temp google user
    await setRedisCache(code, googleUser, 0.1, true);
  }

  if (!googleUser) {
    return next(new AppError('Google Auth Failed', 400));
  }

  //Search via google unique field if not user the googleId
  const existingUser = await User.findOne({ email: googleUser.email });
  if (existingUser) {
    //unset temp google user - automatic after expiry
    createAndSendToken(existingUser, 200, res, true);
  } else if (referId) {
    const referedBy = await User.findOne({
      uniqueReferLink: referId,
    });
    if (referedBy) {
      const uniqueReferLink = randomstring.generate({
        length: 10,
        charset: ['alphabetic', 'numeric'],
      });

      const newUser = await User.create({
        //Add Google specific fields
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        MOL: 'GOOGLE',
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
    res.redirect(
      process.env.REACT_URL +
        `?auth=verify-referral&provider=google&code=${code}`
    );
    // return next(new AppError("No ReferId Found", 400));
  }
});

const getGoogleUser = async (id_token, access_token) => {
  try {
    const res = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

// interface GoogleUserResult {
//   id: string;
//   email: string;
//   verified_email: boolean;
//   name: string;
//   given_name: string;
//   family_name: string;
//   picture: string;
//   locale: string;
// }

module.exports = { oauth2Client, authWithGoogle, googleUrlGenerator };
