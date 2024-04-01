// Va sur internet pour pécho les infos dont on a besoingrâce au ISBN fourni
// Imports
const https = require("https");

//Constantes
const API1 = "https://www.googleapis.com/books/v1/volumes?q=isbn:"
const API2 = "https://openlibrary.org/api/books?jscmd=details&format=json&bibkeys=ISBN:"
const imgURL = "https://covers.openlibrary.org/b/isbn/"
const posFinImgURL = ["-L.jpg", "-M.jpg", "-S.jpg"]
const APIS = [API1, API2, imgURL, posFinImgURL]

//
const _livre_ = {
    titre: undefined, auteurs: undefined, edition: undefined,
    editeurs: undefined, soustitre: undefined, releaseDate: undefined,
    description: undefined, langue: undefined, ISBN10: undefined,
    ISBN13: undefined, nPages: undefined, format: undefined,
    series: undefined, sujets: undefined, image: undefined,
};

// Fonctions
async function get_JSON_from(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => { let data = "";
            response.on("data", (chunk) => { data += chunk; });
            response.on("end", () => {
                try {const jsonData = JSON.parse(data);resolve(jsonData);}
                catch (error) {reject(error)}});
        }).on("error", (error) => {reject(error);});});
}; async function request_API(ISBN, API) {
    try {return extract(await get_JSON_from(`${API}${ISBN}`), API, ISBN)}
    catch{ return {} };
}; async function extract(data, API, ISBN) {
    const n_api = [API1, API2].indexOf(API)
    var livre = {
        titre: undefined,
        auteurs: undefined,
        edition: undefined,
        editeur: undefined,
        editeurs: undefined,
        soustitre: undefined,
        releaseDate: undefined,
        description: undefined,
        langues: undefined,
        langue: undefined,
        ISBN10: undefined,
        ISBN13: undefined,
        nPages: undefined,
        format: undefined,
        series: undefined,
        sujets: undefined,
        image: undefined,
    }; if (n_api==0) { // GoogleBooks
        const requirements = {
            titre: "infos.title",
            auteurs: "infos.authors",
            format: "infos.printType",
            nPages: "infos.pageCount",
            description: "infos.description",
            ISBN10: "ISBNS[0].identifier",
            ISBN13: "ISBNS[1].identifier",
            sujets: "infos.categories",
            langue: "infos.language",
            editeur: "infos.publisher",
            releaseDate: "infos.publishedDate"
        }; try { const infos = data.items[0].volumeInfo; // Nécessaire (ne pas supprimer)
            const ISBNS = infos.industryIdentifiers;  // Nécessaire (ne pas supprimer)
            Object.keys(requirements).forEach( (value) => {
                try { let result = eval(requirements[value])
                    if (result!=undefined) {livre[value] = result}}
                catch {console.log(`La proprieté ${value} est indisponible`)}})
        } catch {console.log(`Aucune instance ne correspond à l'ISBN <${ISBN}>`)}
    } else if (n_api==1) { // OpenLibrary
        const requirements = {
            titre: "infos.title",
            releaseDate: "infos.publish_date",
            nPages: "infos.number_of_pages",
            ISBN10: "infos.isbn_10[0]",
            ISBN13: "infos.isbn_13[0]",
            sujets: "infos.subjects",
            series: "infos.series",
            editeurs: "infos.publishers",
            auteurs: "infos.authors",
            langues: "infos.languages",
            image: "infos.thumbnail_url"
        }; try { const infos = data[`ISBN:${ISBN}`].details; // Nécessaire (ne pas supprimer)
            Object.keys(requirements).forEach( (value) => {
                try {
                    if (value == "auteurs") { var auteurs = [];
                        eval(requirements[value]).forEach( (author) => {
                            auteurs = auteurs.concat(auteurs, [author.name]);});
                        livre.auteurs = auteurs
                    } else if (value == "langues") { var langues = [];
                        eval(requirements[value]).forEach( (language) => {
                            langues = langues.concat(langues, [language.key.slice(11)]);});
                        livre.langues = langues
                    } else { let result = eval(requirements[value])
                        if (result!=undefined) {livre[value] = result}}
                } catch {console.log(`La proprieté ${value} est indisponible`)}})
        } catch (error) {console.log(`Aucune instance ne correspond à l'ISBN <${ISBN}>`)}
    } else { // Unspecified
        console.log(`L'API sollicitée (${n_api}) n'a pas de méthode associée.`);
    return data;}; return livre;
}; async function compare_info(data1, data2) {
    var infos = {
        titre: undefined, auteurs: undefined,
        edition: undefined, editeur: undefined,
        editeurs: undefined, soustitre: undefined,
        releaseDate: undefined, description: undefined,
        langues: undefined, langue: undefined, ISBN10: undefined,
        ISBN13: undefined, nPages: undefined, format: undefined,
        series: undefined, sujets: undefined, image: undefined,
    }; Object.keys(data1).forEach((key) => {infos[key] = data1[key]});
    Object.keys(data2).forEach((key) => {
        if (infos[key] == undefined) { infos[key] = data2[key] }
        else {}; // TODO // Pour l'instant s'il y a des champ renseignés par les deux APIs c'est tjrs la 1e qui est gardée
    }); return infos;
};

// Exports
module.exports = { request_API, APIS, compare_info, _livre_ };