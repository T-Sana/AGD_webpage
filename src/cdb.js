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
for (let i=0; i<n_dirs; i++) {
    const html = get_data_from(`${db}/${fs.readdirSync(db)[i]}`);
    DBS[DBS.length] = html;
}
module.exports = { DBS };