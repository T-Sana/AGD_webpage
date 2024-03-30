const { DBS, DBNS } = require("./cdb.js");
const { hash } = require("./hash.js");
const jwt = require('jsonwebtoken');

function get_rights(user, pwd, users) {
    const { token } = req.cookies;
    const token_info = jwt.verify(token, process.env.SECRET_KEY);
    return 0
}
function log_in(req, res, username, password) {
    console.log(`<${username}>:<${password}>`);
    const db = req.originalUrl.slice(8).replace("/", "");
    console.log(db)
    console.log(DBS[DBNS.indexOf(`${db}.txt`)].users);
    const users = DBS[DBNS.indexOf(`${db}.txt`)].users;
    if (username in users) {
        if (hash(password) == users[username][0]) {
            const token = jwt.sign(
                { u_n: username,  pwd: hash(password), rights: users[username][1]},
                process.env.SECRET_KEY,
                { expiresIn: process.env.JWT_EXPIRE }
              );
            res.cookie("token", token);
            console.log(`Logged to ${db}`)
            return req, res, true;
        };
    };
    return req, res, false;
};

function is_logged(req) {
    try {
        const db = req.originalUrl.slice(8);
        const { token } = req.cookies;
        const token_info = jwt.verify(token, process.env.SECRET_KEY);
        if (process.env.DEBUG) { console.log(token_info) };
        const users = DBS[DBNS.indexOf(`${db}.txt`)].users
        if (token_info.u_n in users) {
            if (token_info.pwd == users[token_info.u_n][0]) {
                console.log(`Correctly logged into ${db}`)
                return true
            };
        };
        return false
  } catch (error) {
        if (typeof error == "object") {
            console.log("Erreur liée au token! (Pas connecté·e ?)");
        } else {
            console.log(error)
        }
        return false;
  };
};

module.exports = { get_rights, log_in, is_logged };