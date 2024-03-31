// Requires //
const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router();
const { hash, hashy } = require("./hash.js")
const { DBS, DBNS, insert } = require("./api_db.js");
const { get_rights, log_in, is_logged } = require("./auth.js");
const { request_API, APIS } = require("./api_get_info.js");


// Fonctions //
function erreur404(res) { return res.render("404") };
function get_books(database) { return DBS[DBNS.indexOf(`${database}.txt`)].books };
function db_exists(DB_NAME) {
  var num=-1; var is_db=false;
  for (let i=0; i<DBNS.length; i++) { if (DBNS[i] == `${DB_NAME}.txt`)
  { is_db=true; num=i };}; return { is_db, num };
};

router // Table de routage //
  .get("/", (req, res) => {res.redirect("/src");}) // Racine redirigeant vers l'acceuil du site
  .get("/src", async(req, res) => {res.render("acceuil", { DBS, DBNS });}) // Acceuil du site
  .get("/rm", async (req, res) => {res.clearCookie('token').redirect("/");}) // Removes token
  .get("/bot/db/*", async (req, res) => { // Donne les ID's des documents de la DB <any>
    const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
    let {is_db, num} = db_exists(req_db); // Checking the existence of the sollicited DB
    if (!is_db) { erreur404(res) } // If DB <any> doesn't exist
    res.send(Object.keys(DBS[DBNS.indexOf(`${req_db}.txt`)].books))
  })
  .get("/src/db/*", async (req, res) => { // Acceuil de la DB <any>
    const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
    let {is_db, num} = db_exists(req_db); // Checking the existence of the sollicited DB
    if (!is_db) { erreur404(res) } // If DB <any> doesn't exist
    else if (!is_logged(req)) {res.redirect(`/login/db/${req_db}`)} // In not logged in
    else { // If logged: extract and send token's info
      const nameDB = DBNS[num]; const dataDB = DBS[num];
      const { token } = req.cookies;
      const token_info = jwt.verify(token, process.env.SECRET_KEY);
      token_info.pwd = hashy(token_info.pwd)
      res.render("acceuilDB",  { num, nameDB, dataDB, token_info });};
  })
  .post("/src/db/*", async (req, res) => { // Vrai login de la DB <any> (dans le code je veux dire)
    const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
    if (!db_exists(req_db).is_db) {erreur404(res);}; // If DB <any> doesn't exist
    let logd; req, res, logd = log_in(req, res, req.body.username, req.body.userpswd);
    if (logd) {res.redirect(`/src/db/${req_db}`)}
    else {res.send(`Couldn't connect.<br><a href="/login/db/${req_db}">Retry</a>`)};
  })
  .get("/login/db/*", async (req, res) => { // Login de la DB <any>
    const req_db = req.originalUrl.slice(10).replace("/", "");
    if (!db_exists(req_db).is_db) {erreur404(res);}
    else {res.render("loginDB", {req_db})};
  })
  .get("/src/view/db/*/*", async (req, res) => { // Visualisation de linstance <any> de la DB (en JSON)
    const r = req.originalUrl.slice(13);
    const DBN = r.split("/")[0];
    const ID = r.split("/")[1];
    console.log(DBN);
    if (!db_exists(DBN).is_db) {erreur404(res);};
    const data = get_books(DBN);
    if (`id_${ID}` in data) {res.send(data[`id_${ID}`])}
    else {res.send(`The element with <${ID}> id doesn't exist`)};
  })
  .get("/src/view/db/*", async (req, res) => { // Visualisation de la DB (en JSON)
    const DBN = req.originalUrl.slice(13).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {erreur404(res);}
    else {res.send(get_books(DBN))};
  })
  .get("/src/mod/db/*/add", async (req, res) => { // Ajout d'une instance dans la DB <any>
    const DBN = req.originalUrl.slice(12, req.originalUrl.length-4).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {erreur404(res);};
    res.render("ajout", {DBN});
  })
  .post("/src/mod/db/*/add", async (req, res) => { // Vrai ajout de l'instance dans la DB <any>
    const DBN = req.originalUrl.slice(12, req.originalUrl.length-4).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {erreur404(res);};
    console.log(req.body); // Has to write this into the DB // TODO
    console.log(DBS[DBNS.indexOf(`${DBN}.txt`)].books)
    DBS[DBNS.indexOf(`${DBN}.txt`)] = insert(await request_API(req.body.ISBN13), DBS[DBNS.indexOf(`${DBN}.txt`)])
    console.log(DBS[DBNS.indexOf(`${DBN}.txt`)].books)
    res.redirect(req.originalUrl); // Goes back to the input page
  }) // Mettre dans un cookie s'il recommence ou s'il va à la home page // TODO
  .get("/src/mod/db/*/add-by-ISBN", async (req, res) => { // Ajout d'une instance par ISBN dans la DB <any>
    const DBN = req.originalUrl.slice(12, req.originalUrl.length-12).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {erreur404(res);};
    res.render("ajoutISBN", {DBN});
  })
  .post("/src/mod/db/*/add-by-ISBN", async (req, res) => { // Vrai ajout de l'instance par ISBN dans la DB <any>
    const DBN = req.originalUrl.slice(12, req.originalUrl.length-12).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {erreur404(res);};const ISBN = req.body.ISBN;
    const infos = {google_books: await request_API(ISBN, APIS[0]), openlibrary: await request_API(ISBN, APIS[1])}
    res.send(infos);console.log(`<${infos}>`);
  }) // Doit redirect vers un formulaire avec en placholders les infos récupérées // TODO

let ISBN = "9782210754676"
request_API(ISBN, APIS[0]), request_API(ISBN, APIS[1])
router.get("/*",async(req,res)=>{erreur404(res)}); // Erreur 404 (n'importe quelle autre page)
module.exports = { router }; // Exportation pour que app.js puisse le récup