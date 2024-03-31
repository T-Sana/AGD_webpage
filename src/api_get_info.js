// Va sur internet pour pécho les infos dont on a besoingrâce au ISBN fourni
const https = require("https");
const API1 = "https://www.googleapis.com/books/v1/volumes?q=isbn:"
const API2 = "https://openlibrary.org/api/books?jscmd=details&format=json&bibkeys=ISBN:"
const imgURL = "https://covers.openlibrary.org/b/isbn/"
const posFinImgURL = ["-L.jpg", "-M.jpg", "-S.jpg"]
const APIS = [API1, API2, imgURL, posFinImgURL]

// Fonctions
async function get_JSON_from(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => { let data = "";
            response.on("data", (chunk) => { data += chunk; });
            response.on("end", () => {
                try {const jsonData = JSON.parse(data);resolve(jsonData);}
                catch (error) {reject(error)}});
        }).on("error", (error) => {reject(error);});});
};
async function request_API(ISBN, API) {
    const URL = `${API}${ISBN}`;console.log(URL);
    try {
        const data = await get_JSON_from(URL);
        return extract(data, API, ISBN)
    }
    catch (error) {console.error("Error while getting data:", error.message);}
};
async function extract(data, API, ISBN) {
    const n_api = [API1, API2].indexOf(API)
    console.log(n_api)
    var livre = {
        titre: "",
        auteurs: [],
        edition: "",
        editeur: "",
        editeurs: "",
        soustitre: "",
        releaseDate: "",
        description: "",
        langues: "",
        langue: "",
        ISBN10: "",
        ISBN13: "",
        nPages: "",
        format: "",
        series: "",
        sujets: [],
        image: "",
    }
    if (n_api==0) { // GoogleBooks
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
        }; try { const infos = data.items[0].volumeInfo // Nécessaire (ne pas supprimer)
            const ISBNS = infos.industryIdentifiers  // Nécessaire (ne pas supprimer)
            Object.keys(requirements).forEach( (value) => {
                try { let result = eval(requirements[value])
                    if (result!=undefined) {livre[value] = result}}
                catch {console.log(`La proprieté ${value} est indisponible`)}})
        } catch (error) {console.log(`Aucune instance ne correspond à l'ISBN <${ISBN}>`)}
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
        console.log(`L'API sollicitée est inéxistante (${n_api})`);return data;
    }; console.log(livre); // À supr
    return data;
};
function compare_info(data1, data2) {
    var infos = {
        titre: "", auteurs: [],
        edition: "", editeur: "",
        editeurs: "", soustitre: "",
        releaseDate: "", description: "",
        langues: "", langue: "", ISBN10: "",
        ISBN13: "", nPages: "", format: "",
        series: "", sujets: [], image: "",
    };
    Object.keys(data1).forEach((key) => {
        if (!data1.key in [undefined, "", []]) {infos.key = data1.key}
    });
    Object.keys(data2).forEach((key) => {
        if (!data2.key in [undefined, "", []]) {
            if (!infos.key in [undefined, "", []]) {
                infos.key = data2.key
            } else {
                // TODO // Pour l'instant s'il y a des champ renseignés par les deux APIs c'est tjrs la 1e qui est gardée
            };
        };
    });
};

module.exports = { request_API, APIS };