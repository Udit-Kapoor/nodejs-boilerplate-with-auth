const Moralis = require('moralis').default;
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const User = require('../../models/userModel');
const ReferList = require('../../models/referListModel');
const randomstring = require('randomstring');
const { createAndSendToken } = require('./authController');
const { web3VerifySchema } = require('../../validations/authValidator');
const { supportedNetwork } = require('../../drivers/constants');

const config = {
  domain: process.env.APP_DOMAIN,
  statement: 'Please sign this message to confirm your identity.',
  uri: process.env.REACT_URL,
  timeout: 120,
};

exports.requestMessage = catchAsync(async (req, res, next) => {
  const { address, chain, network } = req.body;
  if (!address || !network) {
    return next(new AppError('Address and Network is required', 400));
  }
  let message;
  if (network === supportedNetwork.EVM) {
    message = await Moralis.Auth.evm.requestChallengeEvm({
      address,
      chainId: chain,
      ...config,
    });
  } else if (network === supportedNetwork.SOLANA) {
    message = await Moralis.Auth.solana.requestChallengeSol({
      address,
      network: 'mainnet',
      ...config,
    });
  }

  if (!message) {
    return next(new AppError('Can not Generate Message', 400));
  }

  const existingUser = await User.findOne({ wallet: address });

  res.status(200).json({
    status: 'success',
    message: message,
    existingUser: existingUser ? true : false,
  });
});

exports.existingWalletCheck = catchAsync(async (req, res, next) => {
  const { address } = req.query;
  if (!address) {
    return next(new AppError('Address is required', 400));
  }

  const existingUser = await User.findOne({ wallet: address });

  res.status(200).json({
    status: 'success',
    existingUser: existingUser ? true : false,
  });
});

exports.verify = catchAsync(async (req, res, next) => {
  try {
    const { error } = web3VerifySchema.validate(req.body);

    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    const { message, signature, network, referId } = req.body;

    const { address, profileId } = (
      await Moralis.Auth.verify({
        message,
        signature,
        networkType: network,
      })
    ).raw;

    if (!address) {
      return next(new AppError('Invalid Signature', 400));
    }

    const existingUser = await User.findOne({ wallet: address });
    if (existingUser) {
      createAndSendToken(existingUser, 200, res);
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
          wallet: address,
          network: network,
          profileId: profileId,
          MOL: 'WALLET',
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
      return next(new AppError('No ReferId Found', 400));
    }
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});
