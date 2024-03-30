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

var DBS = [], DBNS = [];
for (let i=0; i<n_dirs; i++) {
    let db_ = fs.readdirSync(db)[i]; // get the DB's name
    let data = get_data_from(`${db}/${db_}`); // get the data from the DB
    DBS[DBS.length] = JSON.parse(data); // save the data in js in an array
    DBNS[DBNS.length] = db_; // save the name of the DB in an array
    console.log(`Succesfully loaded database <${db_}>`);
}

module.exports = { DBS, DBNS };