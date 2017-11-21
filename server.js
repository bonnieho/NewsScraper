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

// var Note = require("./models/Note.js");
// var Article = require("./models/Article.js");


var PORT = 3000;
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database    
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoVoxFeed";


// Initializing Express
var app = express();



// +++++++++   Configuring the middleware  +++++++++++++++

// logging requests with morgan
app.use(logger("dev"));

// body-parser for form submissions
app.use(bodyParser.urlencoded({ extended: false }));

// express.static sets the public folder as a static directory
app.use(express.static("public"));

// mongoose set up for JavaScript ES6 Promises
mongoose.Promise = Promise;


// +++++ Connecting to the Mongo DB using mongoose  +++++

mongoose.connect("mongodb://localhost/mongoVoxFeed", {
  useMongoClient: true
});

/* ==========  confirming mongo db connection ================ */

// var yep = mongoose.connection;

// show any mongoose errors 

// yep.on('error', function(err) {
//  console.log('Mongoose Error: ', err);
//});

// once logged in to the db through mongoose, log a success message

// yep.once('open', function() {
//  console.log('Mongoose connection successful.');
//});





// ==========   Routes   ==============

// main index route
app.get('/', function(req, res) {
  return res.send(index.html);
});

// A GET route for scraping the vox.com website
app.get('/scrape', function(req, res) {
  // First, we grab the body of the html with request
    axios.get("http://www.vox.com/").then(function(response) {

    // Then, we load that into cheerio and save it to $ for a jQuery-flavored shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an div tag (this is how Vox has their news page set up), and do the following:
    $('div h2').each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children('a')
        .text();
      result.link = $(this)
        .children('a')
        .attr('href');

      // Create a new Article using the 'result' object built from scraping
      db.Article
        .create(result)
        .then(function(dbArticle) {
          // This message is sent if we were able to successfully scrape and SAVE an Article.
          return res.send('Scrape Complete');
        })
        .catch(function(err) {
          // If there's an error, send it to the client
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
      // If there's an error, send it to the client
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
      // If we were able to successfully FIND an article with the GIVEN id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If there's an error, send it to the client
      res.json(err);
    });
});

// Route for to SAVE or UPDATE an article's associated Note
app.post('/articles/:id', function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one article with an '_id equal to 'req.params.id'. Update the article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another '.then' which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully UPDATE an article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If there's an error, send it to the client
      res.json(err);
    });
});

// starting the server
app.listen(process.env.PORT || 3000, function() {
  console.log('App running on port ' + PORT);
});

