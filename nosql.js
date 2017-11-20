var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

// Use morgan and bodyParser with app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
	extended: false
}));

// make public a static directory
app.use(express.static('public'));

// database configuration with mongoose
mongoose.connect('mongodb://heroku_rdh0251f:mlfjfda13205s38p5mtuom246j@ds017726.mlab.com:17726/heroku_rdh0251f');
// mongoose.connect('mongodb://localhost/onionScraper');
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



////////////
// ROUTES //
////////////

// main index route
app.get('/', function(req, res) {
	res.send(index.html);
});

// a GET request to scrape the Onion website.
app.get('/scrape', function(req, res) {

	request('http://www.theonion.com/', function(error, response, html) {

		var $ = cheerio.load(html);

		$('article h2').each(function(i, element) {
			var result = {};

			result.title = $(this).children('a').text();
			result.link = $(this).children('a').attr('href');

			var entry = new Article (result);
			entry.save(function(err, doc) {
				if (err) {
					console.log(err);
				} else {
					console.log(doc);
				}
			});
		});
	});
	res.send('Scrape complete');
});

// gets all of the articles scraped from mongoDB
app.get('/articles', function(req, res) {
	Article.find({}, function(err, doc) {
		if (err) {
			console.log(err);
		} else {
			res. json(doc);
		}
	});
});

// grab article by its ObjectID
app.get('/articles/:id', function(req, res) {
	Article.findOne({'_id': req.params.id})

	.populate('note')
	.exec(function(err, doc) {
		if(err){
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});

//replace the existing note of an article with a new one, or if no note exists for an article, make the posted note its note.
app.post('/articles/:id', function(req, res) {
	var newNote = new Note(req.body);
	newNote.save(function(err, doc) {
		if(err) {
			console.log(err);
		} else {
			Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
			.exec(function(err, doc) {
				if(err) {
					console.log(err);
				} else {
					res.send(doc);
				}
			});
		}
	});
});


// listen on port 3000
app.listen(process.env.PORT || 3000, function() {
	console.log('App running on port 3000');
});