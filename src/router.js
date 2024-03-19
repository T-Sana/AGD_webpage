// Requires //
const express = require("express");
const router = express.Router();
const { DBS, DBNS } = require("./cdb.js");

// Fonctions //
function erreur404(res) { return res.render("404") };

router // Table de routage //
  .get("/", (req, res) => {
    res.redirect("/src");
  })

  .get("/src", async (req, res) => {
    console.log(DBS)
    res.render("acceuil", { DBS, DBNS });
  })

  .get("/src/db/", async (req, res) => {
    res.redirect("/");
  })

  .get("/src/db/*", async (req, res) => {
    const req_db = req.originalUrl.slice(8);
    var num; var is_in = false;
    for (let i=0; i<DBNS.length; i++) {
      if (`${req_db}.txt` == DBNS[i]) { is_in=true; num=i } };
    if (is_in) { res.send(`${num}`) } else { erreur404(res) };
  })

  .get("/*", async (req, res) => {
    erreur404(res)
  })
module.exports = { router };
