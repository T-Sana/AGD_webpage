// Requires //
const { get_databases, creer_db, insert, write_into, db_dir } = require("./api_db.js");
const { request_API, APIS, compare_info, _livre_ } = require("./api_get_info.js");
const { get_rights, log_in, is_logged } = require("./auth.js");
const { hash, hashy } = require("./hash.js");
const jwt = require('jsonwebtoken');
const express = require("express");
const router = express.Router();


// Fonctions //
function erreur404(res) {return res.render("404")};
function get_books(database) {
  var { DBS, DBNS } = get_databases(); // Get databases info
  return DBS[DBNS.indexOf(`${database}.txt`)].books
};function db_exists(DB_NAME) {
  var { DBS, DBNS } = get_databases(); // Get databases info
  var num=-1; var is_db=false;
  for (let i=0; i<DBNS.length; i++) { if (DBNS[i] == `${DB_NAME}.txt`)
  { is_db=true; num=i };}; return { is_db, num };
};function get_token(req) { // Get the token info
  try{return jwt.verify(req.cookies.token, process.env.SECRET_KEY) } catch {};
};function can_write(token) {
  var wr = false;[4,5,9].some((value) => {if (token.rights == value) {wr=true}});return wr;
};

router // Table de routage //
  .get("/", (req, res) => {res.redirect("/src");}) // Racine redirigeant vers l'acceuil du site
  .get("/rm", async (req, res) => {res.clearCookie('token').redirect("/")}) // Removes token
  .get("/src",async (req, res) => {var { DBS, DBNS } = get_databases(); // Acceuil du site
    res.render("acceuil", { DBS, DBNS });
  }).get("/src/new/db", async (req, res) => {res.render("new_db")}) // Create a new DB
  .post("/src/new/db", async (req, res) => {
    var { DBS, DBNS } = get_databases(); // Get databases info
    var infos = req.body;infos.pwd1 = hash(infos.pwd1);
    var DB = {users: {[infos.DB_root]: [infos.pwd1, 9]},books: {}};
    if (DBNS.includes(`${infos.DB_name}.txt`)||infos.DB_name=="_"){res.send(`DB <${infos.DB_name}> already exists !`)} else {
    creer_db(`${db_dir}/${infos.DB_name}.txt`, JSON.stringify(DB, null, 2), infos.DB_name);
    res.send(`The DB ${req.body.DB_NAME} has been created <a href="/src/db/${req.body.DB_name}">HERE</a>.`)};
  }).get("/bot/db/*", async (req, res) => { // Donne les ID's des documents de la DB <any>
    var { DBS, DBNS } = get_databases(); // Get databases info
    const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
    let {is_db, num} = db_exists(req_db); // Checking the existence of the sollicited DB
    if (!is_db) { return erreur404(res) } // If DB <any> doesn't exist
    res.send(Object.keys(DBS[DBNS.indexOf(`${req_db}.txt`)].books))
  }).get("/src/db/*", async (req, res) => { // Acceuil de la DB <any>
    var { DBS, DBNS } = get_databases(); // Get databases info
    const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
    let {is_db, num} = db_exists(req_db); // Checking the existence of the sollicited DB
    if (!is_db) { return erreur404(res) } // If DB <any> doesn't exist
    else if (!is_logged(req)) {res.redirect(`/login/db/${req_db}`)} // In not logged in
    else { // If logged: extract and send token's info
      const nameDB = DBNS[num]; const dataDB = DBS[num];
      const { token } = req.cookies;
      const token_info = jwt.verify(token, process.env.SECRET_KEY);
      token_info.pwd = hashy(token_info.pwd)
      res.render("acceuilDB",  { num, nameDB, dataDB, token_info });};
  }).post("/src/db/*", async (req, res) => { // Vrai login de la DB <any> (dans le code je veux dire)
    const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
    if (!db_exists(req_db).is_db) {return erreur404(res);}; // If DB <any> doesn't exist
    let logd; req, res, logd = log_in(req, res, req.body.username, req.body.userpswd);
    if (logd) {res.redirect(`/src/db/${req_db}`)}
    else {res.send(`Couldn't connect.<br><a href="/login/db/${req_db}">Retry</a>`)};
  }).get("/login/db/*", async (req, res) => { // Login de la DB <any>
    const req_db = req.originalUrl.slice(10).replace("/", "");
    if (!db_exists(req_db).is_db) {erreur404(res);}
    else {res.render("loginDB", {req_db})};
  }).get("/src/view/db/*/*", async (req, res) => { // Visualisation de l'instance <any> de la DB
    const r = req.originalUrl.slice(13); const DBN = r.split("/")[0], ID = r.split("/")[1];
    if (!db_exists(DBN).is_db) {return erreur404(res)};
    const data = get_books(DBN);const doc = data[ID];
    if (ID in data) {res.render("view_instance", { doc })}
    else {res.send(`The element with <${ID}> id doesn't exist`)};
  }).get("/src/view/db/*", async (req, res) => { // Visualisation de la DB (en JSON)
    const DBN = req.originalUrl.slice(13).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {erreur404(res);}
    else {
      const docs = get_books(DBN);
      res.render("view_db_data", { docs, DBN })
    };
  }).get("/src/mod/db/*/add", async (req, res) => { // Get infos for une instance dans la DB <any>
    var DBN = req.originalUrl.slice(12); DBN = DBN.slice(0, DBN.indexOf("/")); // Get the DB's name
    if (!db_exists(DBN).is_db || !can_write(get_token(req))) {return erreur404(res);}; // Refuse la connection s'il manque des droits
    res.render("ajout", {DBN, _livre_});
  })
/*
  ,---------------------+---------------------¬
  |  /\ OVER HERE: DONE | \/ UNDER HERE: TODO |
  `---------------------+---------------------´
*/
  .post("/src/mod/db/*/add", async (req, res) => { // Ajout de l'instance dans la DB <any>
    var { DBS, DBNS } = get_databases(); // Get databases info
    const DBN = req.originalUrl.slice(12, req.originalUrl.length-4).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db || !can_write(get_token(req))) {return erreur404(res);}; // Refuse la connection s'il manque des droits
    req.body.editeurs = req.body.editeurs.split(", ");
    req.body.auteurs = req.body.auteurs.split(", ");
    req.body.sujets = req.body.sujets.split(", ");
    req.body.series = req.body.series.split(", ");
    DBS[DBNS.indexOf(`${DBN}.txt`)] = insert(req.body, DBS[DBNS.indexOf(`${DBN}.txt`)]); // Insert the new instance into the DB variable
    write_into(`${db_dir}/${DBN}.txt`, JSON.stringify(DBS[DBNS.indexOf(`${DBN}.txt`)], null, 2));  // Update the .txt DB
    console.log(req.query.loop)
    try {
      if (req.query.loop == "true") {res.redirect(req.originalUrl); // Goes back to the input page
      } else {throw Error}} catch {res.redirect(`/src/db/${DBN}`)}; // Va à l'acceuil de la DB
  })
  .get("/src/mod/db/*/add-by-ISBN", async (req, res) => { // Get ISBN pour une instance à mettre dans la DB <any>
    const DBN = req.originalUrl.slice(12, req.originalUrl.length-12).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db || !can_write(get_token(req))) {erreur404(res);}; // Refuse la connection s'il manque des droits
    res.render("ajoutISBN", {DBN});
  })
  .post("/src/mod/db/*/add-by-ISBN", async (req, res) => { // Vrai ajout de l'instance par ISBN dans la DB <any>
    const DBN = req.originalUrl.slice(12, req.originalUrl.length-12).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db || !can_write(get_token(req))) {erreur404(res);}; // Refuse la connection s'il manque des droits
    const ISBN = req.body.ISBN;
    var infos = {google_books: await request_API(ISBN, APIS[0]), openlibrary: await request_API(ISBN, APIS[1])}
    infos["GB_&_OL"] = await compare_info(infos.google_books, infos.openlibrary);
    res.send(infos); // Doit inserer les infos dans la DB <any> et non pas les envoyer en JSON à l'user
  }) // Doit redirect vers un formulaire avec en placholders les infos récupérées // TODO

router.get("/*",async(req,res)=>{erreur404(res)}); // Erreur 404 (n'importe quelle autre page)
module.exports = { router }; // Exportation pour que app.js puisse le récup