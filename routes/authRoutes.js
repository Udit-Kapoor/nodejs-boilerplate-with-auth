const router = require('express').Router();

const {
  signup,
  login,
  checkReferId,
} = require('../controllers/auth/authController');
const {
  authWithGoogle,
  googleUrlGenerator,
} = require('../controllers/auth/googleAuthController');
const {
  authWithTwitter,
  twitterURLGenerator,
} = require('../controllers/auth/twitterAuthController');
const {
  requestMessage,
  verify,
  existingWalletCheck,
} = require('../controllers/auth/web3AuthController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/check-referrer', checkReferId);

//WEB3 Routes
router.post('/request-message', requestMessage);
router.post('/verify', verify);
router.get('/check-wallet', existingWalletCheck);

//Google Routes
router.get('/oauth/google-url', googleUrlGenerator);
router.get('/oauth/google-auth', authWithGoogle);

//Twitter Routes
router.get('/oauth/twitter-url', twitterURLGenerator);
router.get('/oauth/twitter-auth', authWithTwitter);

module.exports = router;
