const { get_rights } = require("./api_db.js");
const { hash } = require("./hash.js");
const jwt = require('jsonwebtoken');
var { DBS, DBNS } = require("./api_db.js");

function log_in(req, res, username, password){ // Login
    const db=req.originalUrl.slice(8).replace("/",""); // Get the DB name
    const users=DBS[DBNS.indexOf(`${db}.txt`)].users; // Getting users of the DB <any>
    if(username in users){if(hash(password)==users[username][0]) // Checking username and password
    {const token=jwt.sign({u_n:username,pwd:hash(password), ///////// Create a cookie 
    rights:users[username][1]},process.env.SECRET_KEY, ////////////// to prove you're
    {expiresIn:process.env.JWT_EXPIRE});res.cookie("token",token); // authentified
    return req,res,true;};};return req,res,false;
};
function is_logged(req) { // Verify someone's log
    try{const db = req.originalUrl.slice(8);const {token}=req.cookies; // Get the DB name ant the cookie
    const token_info=jwt.verify(token,process.env.SECRET_KEY); // Extract info of the cookie's token
    const users=DBS[DBNS.indexOf(`${db}.txt`)].users;if(token_info.u_n // Verifying the
    in users){if(token_info.pwd==users[token_info.u_n][0]) ////////////// token information
    {return true;};};return false} catch { return false;}; // Return a boolean saying logged or not
};
module.exports = { get_rights, log_in, is_logged };