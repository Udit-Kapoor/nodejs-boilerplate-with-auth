const crypto = require('crypto');

function hashString(input) {
  // console.log(input);
  const hash = crypto.createHash('sha256');
  hash.update(input);
  const c = hash.digest('hex');

  return c;
}

module.exports = hashString;
