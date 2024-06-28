const { NODE_ENV } = require('../drivers/constants');

const isProd = (bypass = false) => {
  return bypass || process.env.NODE_ENV === NODE_ENV.PRODUCTION;
};

module.exports = isProd;
