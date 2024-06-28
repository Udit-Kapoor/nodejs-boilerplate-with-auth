const NODE_ENV = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
};

const modeOfLogin = ['WALLET', 'GOOGLE', 'EMAIL', 'TWITTER'];

const supportedNetwork = {
  EVM: 'evm',
  SOLANA: 'solana',
  APTOS: 'aptos',
};

module.exports = {
  NODE_ENV,
  modeOfLogin,
  supportedNetwork,
};
