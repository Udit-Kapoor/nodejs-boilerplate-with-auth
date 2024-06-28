const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const User = require('../../models/userModel');
const ReferList = require('../../models/referListModel');
const randomstring = require('randomstring');
const { createAndSendToken } = require('./authController');
const { Client, auth } = require('twitter-api-sdk');
const {
  readRedisCache,
  setRedisCache,
} = require('../../middlewares/redisMiddleware');
require('dotenv').config();

const twitterAuthClient = new auth.OAuth2User({
  client_id: process.env.TWITTER_CLIENT_ID,
  client_secret: process.env.TWITTER_CLIENT_SECRET,
  callback: process.env.TWITTER_REDIRECT_URL,
  scopes: ['tweet.read', 'users.read', 'offline.access'],
});

const twitterClient = new Client(twitterAuthClient);

const twitterURLGenerator = catchAsync(async (req, res, next) => {
  //Generate the valid URL
  const state = randomstring.generate({
    length: 10,
    charset: ['alphabetic', 'numeric'],
  });
  const authorizationUrl = twitterAuthClient.generateAuthURL({
    state: state,
    code_challenge: state,
    code_challenge_method: 'plain',
  });

  res.status(200).json({ success: 'success', authorizationUrl });
});

const authWithTwitter = catchAsync(async (req, res, next) => {
  const { code, state, referId } = req.query;
  if (!code || !state) {
    return next(new AppError('TwitterCode ,State are required', 400));
  }

  let twitterUser = await readRedisCache(code);

  if (!twitterUser) {
    //Generate the valid URL
    twitterAuthClient.generateAuthURL({
      state: state,
      code_challenge: state,
      code_challenge_method: 'plain',
    });
    //Verify the Valid URL
    let tokens = await twitterAuthClient.requestAccessToken(code);
    if (!tokens) {
      return next(new AppError('Invalid Code', 400));
    }

    //Get user details and unique identifier from Twitter
    twitterUser = await twitterClient.users.findMyUser();
    //set temp user
    await setRedisCache(code, twitterUser, 0.1, true);
  }

  if (!twitterUser) {
    return next(new AppError('Twitter Auth Failed', 400));
  }

  //Search via Twitter unique field = id
  const existingUser = await User.findOne({ twitterId: twitterUser.data.id });
  if (existingUser) {
    //unset temp google user - auto from expiry
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
        //Add Twitter specific fields
        name: twitterUser.data.name,
        twitterId: twitterUser.data.id,
        MOL: 'TWITTER',
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
        `?auth=verify-referral&provider=twitter&code=${code}&state=${state}`
    );
    // return next(new AppError("No ReferId Found", 400));
  }
});

module.exports = {
  twitterAuthClient,
  twitterClient,
  authWithTwitter,
  twitterURLGenerator,
};
