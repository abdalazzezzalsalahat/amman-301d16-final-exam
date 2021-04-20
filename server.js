'use strict'
//#region 
// Application Dependencies
const express = require('express');
const pg = require('pg');
const methodOverride = require('method-override');
const superagent = require('superagent');
const cors = require('cors');
const { urlencoded } = require('express');

// Environment variables
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

///// Express middleware
// Utilize ExpressJS functionality to parse the body of the request
app.use(express,urlencoded({extended : true}));

// Specify a directory for static resources
app.use(express.static('public'));

// define our method-override reference
app.use(methodOverride('_method'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// Use app cors
app.use(cors());

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
//#endregion

// app routes here
// -- WRITE YOUR ROUTES HERE --
app.get('/',home);
app.get('/saveToDB', saveQuote)
app.get('/favorite-quotes', renderQuotes);
app.get('/favorite-quotes/:quote_id', renderDetails);
app.delete('/myFavorites/', deleteQuote);
app.get('*', ErrorHandler);
// callback functions
// -- WRITE YOUR CALLBACK FUNCTIONS FOR THE ROUTES HERE --
function home(req, res){
    const url = `https://thesimpsonsquoteapi.glitch.me/quotes?count=10`;
    superagent.get(url).then(data => {
        res.render('index', {data: data.body});
    }).catch(err => ErrorHandler(err));
}

function saveQuote(req, res){
    const sql = `INSERT INTO sipmsons (quote, character, characterDirection)
                    VALUES ($1, $2, $3);`;
    const vals = [req.body.quote, req.body.character, req.body.characterDirection];
    console.log(req.body.quote);
    client.query(sql, vals).then(data => {
        res.redirect('/favorite-quotes');
    }).catch(err => ErrorHandler(err));
}

function renderQuotes(req, res){
    const sql = `SELECT * FROM sipmsons;`;
    client.query(sql).then(data => {
        res.render('list', {data : data.rows});
    }).catch(err => ErrorHandler(err));
}

function renderDetails(req, res){
    const sql = `SELECT * FROM sipmsons WHERE id = $1;`;
    const val = [req.params.id];
    client.query(sql, val).then(data => {
        res.render('details', {data : data.rows[0]});
    }).catch(err => ErrorHandler(err));
}

function deleteQuote (req, res){
    const sql = `DELETE FROM sipmsons WHERE id = $1;`;
    const val = [req.params.id];
    client.query(sql, val).then(data => {
        res.redirect('/favorite-quotes');
    }).catch(err => ErrorHandler(err));
}

// helper functions

function Simpsons(info){
    this.quote = info.quote;
    this.character = info.character;
    this.characterDirection = info.characterDirection;
}

function ErrorHandler(error, res){
    console.log(error);
    res.render('list', {data : error});
}

// app start point
client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);
