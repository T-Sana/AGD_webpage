const fs = require("fs");
const { randomUUID } = require("crypto");

// Functions
function get_data_from(path) {const data = fs.readFileSync(path).toString();return data;};
function write_into(path, data) {
    fs.writeFile(path, data, { encoding: 'utf8' }, (err) => {
        if (err) {
            console.error('Une erreur est survenue lors de l\'écriture dans le fichier :', err);
        } else {
            console.log('Les données ont été écrites dans le fichier avec succès.');
        }
    });
};
function get_dir(path) {return fs.readdirSync(path)};
function get_len_dir(path) {return get_dir(path).length-1};
function new_id(DB) {var id;do{id=randomUUID()}while(id in Object.keys(DB.books));return id};
function insert(instance, DB) {console.log(instance);DB.books[new_id(DB)] = instance;return DB};
function get_rights(req) {
    try{return jwt.verify(req.cookies.token,process.env.SECRET_KEY).rights}
    catch { return 0 };
}; function ajouter(instance, db, req) {
    if (!get_rights(req) in [4, 9]) {return}
    else {var id;do {id = new_id();}
        while (id in db.books);
        db.books[id] = instance;};
}; function creer_db(path, data, name="any") {
    fs.writeFile(path, data, (err) => {
        if (err) throw err;
        console.log(`Successfully created <${name}> database!`);
    });
};

const db_dir = "databases";

function get_databases() {
    const n_dirs = get_len_dir(db_dir);
    var dbs = get_dir(db_dir);
    dbs.splice(dbs.indexOf("_.txt"));
    var DBS = [], DBNS = [];
    for (let i=0; i<n_dirs; i++) {
        try {var db_ = dbs[i]; // get the DB's name
            let data = get_data_from(`${db_dir}/${db_}`); // get the data from the DB
            DBS[DBS.length] = JSON.parse(data); // save the data in js in an array
            DBNS[DBNS.length] = db_; // save the name of the DB in an array
            console.log(`Succesfully loaded database <${db_}>`);}
        catch {console.log(`Couldn't load database named <${db_}>`);};
    }; return {DBS, DBNS};
};

get_databases()

module.exports = { get_databases, insert, get_rights, write_into, db_dir, creer_db, ajouter };