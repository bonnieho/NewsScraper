var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// These are the scraping tools
      // Axios is a promised-based http library, similar to jQuery's Ajax method
      // It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");


var PORT = 3000;
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database    
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";


// Initializing Express
var app = express();



// Configure middleware


// logging requests with morgan
app.use(logger("dev"));


// body-parser for form submissions
app.use(bodyParser.urlencoded({ extended: false }));


// express.static sets the public folder as a static directory
app.use(express.static("public"));


// mongoose set up for JavaScript ES6 Promises
mongoose.Promise = Promise;


// Connecting to the Mongo DB using mongoose
// MONGODB_URI: mongodb://heroku_qh5rj8lb:ghjjga75hql1tlrcqo92eloe05@ds113626.mlab.com:13626/heroku_qh5rj8lb
mongoose.connect("mongodb://heroku_qh5rj8lb:ghjjga75hql1tlrcqo92eloe05@ds113626.mlab.com:13626/heroku_qh5rj8lb", {
  // check to make sure this is needed
  useMongoClient: true
});

/* ==========  stuff that might work ================ */

var db = mongoose.connection;


// show any mongoose errors
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

// once logged in to the db through mongoose, log a success message
db.once('open', function() {
  console.log('Mongoose connection successful.');
});

// bring in models
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


// main index route
app.get('/', function(req, res) {
  res.send(index.html);
});

/* ==========  END stuff that might work ================ */



// ==========   Routes   ==============

// A GET route for scraping the echojs website
app.get('/scrape', function(req, res) {
  // First, we grab the body of the html with request
  // axios.get("http://www.echojs.com/").then(function(response) {
    axios.get("http://www.reuters.com/").then(function(response) {

// might work...
    // request('http://www.reuters.com/', function(error, response, html) {

    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $('article h2').each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children('a')
        .text();
      result.link = $(this)
        .children('a')
        .attr('href');

      // Create a new Article using the `result` object built from scraping
      db.Article
        .create(result)
        .then(function(dbArticle) {
          // If we were able to successfully scrape and save an Article, send a message to the client
          res.send('Scrape Complete');
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
  });
});

// Route for getting all articles from the db
app.get('/articles', function(req, res) {
  // Grab every document in the articles collection
  db.Article
    .find({})
    .then(function(dbArticle) {
      // If we were able to successfully find articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific article by id, populate it with its note
app.get('/articles/:id', function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article
    .findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate('note')
    .then(function(dbArticle) {
      // If we were able to successfully find an article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an article's associated Note
app.post('/articles/:id', function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one article with an `_id` equal to `req.params.id`. Update the article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// starting the server
app.listen(process.env.PORT || 3000, function() {
  console.log('App running on port ' + PORT);
});

