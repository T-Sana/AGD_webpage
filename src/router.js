const express = require("express");
const router = express.Router();
const { DBS } = require("./cdb.js");

router
  .get("/", (req, res) => {
    res.redirect("/src");
  })

  .get("/src", async (req, res) => {
    console.log(DBS)
    res.render("acceuil");
  })

  .get("/*", async (req, res) => {
    res.render("404");
  })
module.exports = { router };
