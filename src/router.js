// Requires //
const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router();
const { DBS, DBNS } = require("./cdb.js");
const { get_rights, log_in, is_logged } = require("./auth.js");


// Fonctions //
function erreur404(res) { return res.render("404") };

router // Table de routage //
  .get("/", (req, res) => {
    res.redirect("/src");
  })

  .get("/src", async (req, res) => {
    res.render("acceuil", { DBS, DBNS });
  })
  .get("/r", async (req, res) => {
    res.clearCookie('token')
    res.redirect("/")
  })
  .get("/src/db/*", async (req, res) => {
    const req_db = req.originalUrl.slice(8).replace("/", "");
    var num; var is_in = false;
    for (let i=0; i<DBNS.length; i++) {
      if (DBNS[i] == `${req_db}.txt`) { is_in=true; num=i } };
    if (is_in) {
      const nameDB = DBNS[num]; const dataDB = DBS[num];
      console.log(`Connecting to ${nameDB}`)
      if (!is_logged(req)) { // If not logged in ; going to login
        res.redirect(`/login/db/${req_db}`)
      } else { // If logged
        const { token } = req.cookies;
        const token_info = jwt.verify(token, process.env.SECRET_KEY);
        res.render("acceuilDB",  { num, nameDB, dataDB, token_info });
      };
    } else { erreur404(res) };
  })

  .post("/src/db/*", async (req, res) => {
    const req_db = req.originalUrl.slice(8).replace("/", "");
    console.log(`<${req.body.username}>:<${req.body.userpswd}>`);
    let logd;
    req, res, logd = log_in(req, res, req.body.username, req.body.userpswd)
    if (logd) {
      console.log("connecté")
      res.redirect(`/src/db/${req_db}`)
    }
    else {
      console.log("Erreur de connection!")
      res.send(`Error connecting.<br><a href="/login/db/${req_db}">Try again</a>`)
    }
  })

  .get("/login/db/*", async (req, res) => {
    const req_db = req.originalUrl.slice(10);
    var num; var is_in = false;
    for (let i=0; i<DBNS.length; i++) {
      if (DBNS[i] == `${req_db}.txt`) { is_in=true; num=i } };
    if (!is_in) { erreur404(res) }
    else {
      const nameDB = DBNS[num]; const dataDB = DBS[num];
      res.render("loginDB",  { num, nameDB, dataDB })
    }
  })

  .get("/*", async (req, res) => {
    erreur404(res)
  })


module.exports = { router };
