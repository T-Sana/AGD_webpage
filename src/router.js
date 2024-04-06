// Requires //
const { get_databases, creer_db, insert, insert_user, write_into, db_dir, modifier } = require("./api_db.js");
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
};function get_users(database) {
  var { DBS, DBNS } = get_databases(); // Get databases info
  return DBS[DBNS.indexOf(`${database}.txt`)].users
};function db_exists(DB_NAME) {
  var { DBS, DBNS } = get_databases(); // Get databases info
  var num=-1; var is_db=false;
  for (let i=0; i<DBNS.length; i++) { if (DBNS[i] == `${DB_NAME}.txt`)
  { is_db=true; num=i };}; return { is_db, num };
};function get_token(req) { // Get the token info
  try{return jwt.verify(req.cookies.token, process.env.SECRET_KEY) } catch {console.log("Invalid token!")};
};function can_write(token) {
  var wr=false;try{[4,5,9].some((value)=>{if(token.rights==value){wr=true}})}catch{};return wr;
};function can_admin(token) {
  var wr=false;try{[8,9].some((value)=>{if(token.rights==value){wr=true}})}catch{};return wr;
};

router // Table de routage //
  .get("/",                           async (req, res) => {// Racine redirigeant vers l'acceuil du site
    res.redirect("/src"); 
}).get("/rm",                         async (req, res) => { // Removes token
    res.clearCookie('token').redirect("/")
}).get("/src",                        async (req, res) => { // Acceuil du site
    var { DBS, DBNS } = get_databases();
    res.render("acceuil", { DBS, DBNS });
}).get("/src/new/db",                 async (req, res) => { // To create a new DB
  res.render("new_db")
}).post("/src/new/db",                async (req, res) => { // Creates a new DB
    try {
      const ADMIN = JSON.parse(process.env.DB_ADMIN);
      if (req.body.username!=ADMIN.user || hash(req.body.userpswd)!=ADMIN.pwd) {res.send("Invalid credentials")}
      else {
        var { DBS, DBNS } = get_databases(); // Get databases info
        var infos = req.body;
        if (DBNS.includes(`${infos.DB_name}.txt`)||infos.DB_name=="_") {
          res.send(`DB <${infos.DB_name}> already exists !`)
        } else {
          var DB = {users: {[infos.DB_root]: [hash(infos.pwd1), 9]}, books: {}};
          creer_db(`${db_dir}/${infos.DB_name}.txt`, JSON.stringify(DB, null, 2), infos.DB_name);
          res.send(`The DB ${req.body.DB_name} has been created <a href="/src/db/${req.body.DB_name}">HERE</a>.`)
        };
      };
    } catch (e) { console.log(e);erreur404(res) };
}).get("/bot/db/*",                   async (req, res) => { // Donne les ID's des documents de la DB <any>
    var { DBS, DBNS } = get_databases(); // Get databases info
    const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
    let {is_db, num} = db_exists(req_db); // Checking the existence of the sollicited DB
    if (!is_db) { return erreur404(res) } // If DB <any> doesn't exist
    res.send(Object.keys(DBS[DBNS.indexOf(`${req_db}.txt`)].books))
}).get("/src/db/*",                   async (req, res) => { // Acceuil de la DB <any>
    var { DBS, DBNS } = get_databases(); // Get databases info
    const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
    let {is_db, num} = db_exists(req_db); // Checking the existence of the sollicited DB
    if (!is_db) { return erreur404(res) } // If DB <any> doesn't exist
    else if (!is_logged(req)) {res.redirect(`/login/db/${req_db}`)} // In not logged in
    else { // If logged: extract and send token's info
      const nameDB = DBNS[num]; const dataDB = DBS[num];
      const token_info = get_token(req);
      token_info.pwd = hashy(token_info.pwd);
      res.render("acceuilDB",  { num, nameDB, dataDB, token_info });};
}).post("/src/db/*",                  async (req, res) => { // Log into DB <any>
    try {  
      const req_db = req.originalUrl.slice(8).replace("/", ""); // Get sollicited DB's name
        if (!db_exists(req_db).is_db) {return erreur404(res);}; // If DB <any> doesn't exist
        let logd; req, res, logd = log_in(req, res, req.body.username, req.body.userpswd);
        if (logd) {res.redirect(`/src/db/${req_db}`)}
        else {res.send(`Couldn't connect.<br><a href="/login/db/${req_db}">Retry</a>`)};
    } catch { erreur404(res) };
}).get("/login/db/*",                 async (req, res) => { // Form to login into DB <any>
    const req_db = req.originalUrl.slice(10).replace("/", "");
    if (!db_exists(req_db).is_db) {erreur404(res);}
    else {res.render("loginDB", {req_db})};
}).get("/src/view/db/*/*",            async (req, res) => { // Visualisation de l'instance <any> de la DB
    const r = req.originalUrl.slice(13); const DBN = r.split("/")[0], ID = r.split("/")[1];
    if (!db_exists(DBN).is_db) {return erreur404(res)};
    const data = get_books(DBN);const doc = data[ID];
    if (ID in data) {res.render("instance_view", { doc, DBN })}
    else {res.send(`The element with <${ID}> id doesn't exist`)};
}).get("/src/view/db/*",              async (req, res) => { // Visualisation de la DB
    const DBN = req.originalUrl.slice(13).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {erreur404(res);}
    else {
      const docs = get_books(DBN);
      res.render("view_db_data", { docs, DBN })
    };
}).get("/src/mod/db/*/*/mod",         async (req, res) => { // Pour modifier l'instance <any> de la DB
    const r = req.originalUrl.slice(12); const DBN = r.split("/")[0], ID = r.split("/")[1];
    if (!db_exists(DBN).is_db) {return erreur404(res)};
    const data = get_books(DBN);const doc = data[ID];
    if (ID in data) {res.render("instance_modif", { doc, DBN })}
    else {res.send(`The element with <${ID}> id doesn't exist`)};
}).post("/src/mod/db/*/*/mod",        async (req, res) => { // Modification de l'instance <any> de la DB
  const r = req.originalUrl.slice(12); const DBN = r.split("/")[0], ID = r.split("/")[1];
  req.body.titre  = req.body.titre_soustitre.split(", ")[0];
  req.body.soustitre = req.body.titre_soustitre.split(", ")[1] || "";
  delete req.body.titre_soustitre;req.body.id = ID;
  var { DBS, DBNS } = get_databases(); // Get databases info
  DBS[DBNS.indexOf(`${DBN}.txt`)] = modifier(req.body, DBS[DBNS.indexOf(`${DBN}.txt`)], req);
  write_into(`${db_dir}/${DBN}.txt`, JSON.stringify(DBS[DBNS.indexOf(`${DBN}.txt`)], null, 2))
  res.send(DBS[DBNS.indexOf(`${DBN}.txt`)])
}).get("/src/mod/db/*/add",           async (req, res) => { // Get infos pour ajouter une instance dans la DB <any>
    var DBN = req.originalUrl.slice(12); DBN = DBN.slice(0, DBN.indexOf("/")); // Get the DB's name
    if (!db_exists(DBN).is_db || !can_write(get_token(req))) {return erreur404(res);}; // Refuse la connection s'il manque des droits
    res.render("ajout", {DBN, _livre_});
}).get("/src/mod/db/*/add-by-ISBN",   async (req, res) => { // Get ISBN pour une instance à mettre dans la DB <any>
    const DBN = req.originalUrl.slice(12, req.originalUrl.length-12).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db || !can_write(get_token(req))) {erreur404(res);}; // Refuse la connection s'il manque des droits
    res.render("search_ISBN", {DBN});
}).post("/src/mod/db/*/add-by-ISBN",  async (req, res) => { // Ajout de l'instance par ISBN dans la DB <any>
    try {
      const DBN = req.originalUrl.slice(12, req.originalUrl.length-12).replace("/", ""); // Get the DB's name
      if (!db_exists(DBN).is_db || !can_write(get_token(req))) {erreur404(res);}; // Refuse la connection s'il manque des droits
      const ISBN = req.body.ISBN;
      var r_infos = {google_books: await request_API(ISBN, APIS[0]), openlibrary: await request_API(ISBN, APIS[1])}
      r_infos["GB_&_OL"] = await compare_info(r_infos.google_books, r_infos.openlibrary);
      const infos = r_infos["GB_&_OL"];
      res.render("ajout_ISBN", { DBN, infos, _livre_ })
    } catch { erreur404(res) };
}).get("/src/view/users/db/*",        async (req, res) => { // Pour voir les users de la DB <any>  
  const DBN = req.originalUrl.slice(19).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {return erreur404(res);} // Refuse la connection s'il manque des droits
    else {
      var { DBS, DBNS } = get_databases(); // Get databases info
      var usrs = DBS[DBNS.indexOf(`${DBN}.txt`)].users;
      Object.keys(usrs).forEach( (key) => {usrs[key][0] = hashy(usrs[key][0]).slice(0,20)});
      res.render("users_list", { usrs, DBN });
    };
}).get("/src/view/user/*/db/*",       async (req, res) => { // Pour voir les users de la DB <any>  
  const UN =  req.originalUrl.slice(15).split("/")[0]
  const DBN = req.originalUrl.slice(19+UN.length).replace("/", ""); // Get the DB's name
  if (!db_exists(DBN).is_db) {return erreur404(res);} // Refuse la connection s'il manque des droits
    else {
      const users = get_users(DBN);
      if (!Object.keys(users).includes(UN)) {return erreur404(res)}
      else {
        const usr = users[UN];
        const user = {name:UN, pswd:hashy(usr[0]).slice(0, 20), rgts:usr[1], time:usr[2]};
        res.render("user", { user })}
    }
}).get("/src/users/db/*/new",         async (req, res) => { // Pour créer un user
    const DBN = req.originalUrl.slice(14, req.originalUrl.length-4).replace("/", ""); // Get the DB's name
    if (!db_exists(DBN).is_db) {return erreur404(res);}; // Refuse la connection s'il manque des droits
    var is_adm; try {is_adm = can_admin(get_token(req))} catch {is_adm = false};
    res.render("new_user", { DBN, is_adm});
}).post("/src/users/db/*/new",        async (req, res) => { // Création d'un user
    try {  
      const DBN = req.originalUrl.slice(14, req.originalUrl.length-4).replace("/", ""); // Get the DB's name
      if (req.body.rights == undefined) {req.body.rights=1}; // Si les droits d'user sont <undefined> ils deviennent <1>
      if (!db_exists(DBN).is_db) {return erreur404(res)}; // Refuse la connection si la DB n'existe pas
      if (!(can_admin(get_token(req)) || req.body.rights == 1)) {res.send("Vous n'avez pas l'autorisation pour créer cet user")}
      else {
        var users = get_users(DBN); var { DBS, DBNS } = get_databases(); // Get databases info
        var user = {username: req.body.username, password: hash(req.body.pwd1), rights: Number(req.body.rights)};
        if (Object.keys(users).includes(user.username)) {res.send(`User named ${user.username} already exists!`)}
        else { var DB = DBS[DBNS.indexOf(`${DBN}.txt`)]; DB = insert_user(user, DB, req);
          write_into(`${db_dir}/${DBN}.txt`, JSON.stringify(DB, null, 2)); // Update the .txt DB)
         res.send(`Successfully created user <a href="/src/view/user/${user.username}/db/${DBN}">${user.username}</a>.\nRevenir <a href="/src/db/${DBN}">à l'acceuil</a>`)}};
    } catch { erreur404(res) };
}).post("/src/mod/db/*/add",          async (req, res) => { // Ajout de l'instance dans la DB <any> // TODOVER
    try {
      var { DBS, DBNS } = get_databases(); // Get databases info
      const DBN = req.originalUrl.slice(12, req.originalUrl.length-4).replace("/", ""); // Get the DB's name
      if (!db_exists(DBN).is_db || !can_write(get_token(req))) {return erreur404(res);}; // Refuse la connection s'il manque des droits
      req.body.editeurs = req.body.editeurs.split(", "); req.body.auteurs = req.body.auteurs.split(", ");
      req.body.sujets = req.body.sujets.split(", "); req.body.series = req.body.series.split(", ");
      req.body.pret = ""; req.body.reservations = [];
      DBS[DBNS.indexOf(`${DBN}.txt`)] = insert(req.body, DBS[DBNS.indexOf(`${DBN}.txt`)], req); // Inserts the new instance into the DB variable
      write_into(`${db_dir}/${DBN}.txt`, JSON.stringify(DBS[DBNS.indexOf(`${DBN}.txt`)], null, 2)); // Update the .txt DB
      try { if (req.query.loop == "true") {res.redirect(req.originalUrl); // Goes back to the input page
      } else {throw Error} } catch {res.redirect(`/src/db/${DBN}`)}; // Va à l'acceuil de la DB
    } catch { erreur404(res) };
})
  /*
  ,---------------------+---------------------¬
  |  /\ OVER HERE: DONE | \/ UNDER HERE: TODO |
  `---------------------+---------------------´
*/

router.get("/*",async(req,res)=>{console.log(req.originalUrl);erreur404(res)}); // Erreur 404 (n'importe quelle autre page)
module.exports = { router }; // Exportation pour que app.js puisse le récup