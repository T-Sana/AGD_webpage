// TODO
// Créer un système pour que si on a pas les droits on ne puisse acceder à la page (à voir dans router.js)
// pcq là il y a déjà la fonction get rights, maintenant il faut juste vérifier que les droits soient ceux qu'il faut
const { DBS, DBNS, get_rights } = require("./api_db.js");
const { hash } = require("./hash.js");
const jwt = require('jsonwebtoken');


function log_in(req, res, username, password) {
    const db = req.originalUrl.slice(8).replace("/", "");
    const users = DBS[DBNS.indexOf(`${db}.txt`)].users;
    if (username in users) {
        if (hash(password) == users[username][0]) {
            const token = jwt.sign(
                {
                    u_n: username,
                    pwd: hash(password),
                    rights: users[username][1]
                },
                process.env.SECRET_KEY,
                { 
                    expiresIn: process.env.JWT_EXPIRE
                });
            res.cookie("token", token);
            return req, res, true;
        };
    }; return req, res, false;
};

function is_logged(req) {
    try {
        const db = req.originalUrl.slice(8);
        const { token } = req.cookies;
        const token_info = jwt.verify(token, process.env.SECRET_KEY);
        const users = DBS[DBNS.indexOf(`${db}.txt`)].users
        if (token_info.u_n in users) {
            if (token_info.pwd == users[token_info.u_n][0]) {
                return true };};
        return false
  } catch (error) {
    //console.log(error);
    return false;
  };
};
module.exports = { get_rights, log_in, is_logged };