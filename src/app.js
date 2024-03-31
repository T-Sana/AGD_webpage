require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { router } = require('./router');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('views'));
app.use(express.static('views/css'));
app.use(express.static('views/public'));
app.use('/', router);
app.set('view engine', 'ejs');

app.listen(PORT, () => console.info('APP en route sur le port ' + PORT));