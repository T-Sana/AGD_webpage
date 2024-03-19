// Hash //
const crypto = require('crypto');
 
function hash(x) {
    return crypto.createHash('sha1').update(x).digest('hex');
}
module.exports = { hash };