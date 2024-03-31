// Hash //
const crypto = require('crypto');

function hash(x) {return crypto.createHash(`sha512`).update(x).digest('hex');};
function hashy(x) {return crypto.createHash(`sha256`).update(x).digest('hex');};

module.exports = { hash, hashy };