// CDB | Connexion DataBase
const fs = require("fs");

function get_data_from(path) {
    const data = fs.readFileSync(path).toString()
    return data;
  }

function get_len_dir(path) {
    return fs.readdirSync(path).length;
  }
const db = "databases";
const n_dirs = get_len_dir(db);
var DBS = [];
var DBNS = [];
for (let i=0; i<n_dirs; i++) {
    let db_ = fs.readdirSync(db)[i];
    let html = get_data_from(`${db}/${db_}`);
    DBS[DBS.length] = html;
    DBNS[DBNS.length] = db_;
}
module.exports = { DBS, DBNS };