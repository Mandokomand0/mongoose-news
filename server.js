// @comment: Homework 18 - Web Scraper with Express, Handlebars, MongoDB and Cheerio
//https://cryptic-basin-42622.herokuapp.com/


// Node Dependencies
var express = require('express');
var fs = require('fs');
//var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var logger = require('morgan'); // for debugging
var request = require('request'); // for web-scraping
var axios = require("axios");
var cheerio = require('cheerio'); // for web-scraping

// Initialize Express for debugging & body parsing
var app = express();

// Use morgan logger for logging requests
app.use(logger('dev'));

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
  extended: false
}))

// Use express.static to serve the public folder as a static directory

app.use(express.static("public"));

// Express-Handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


// Database Configuration with Mongoose
// ---------------------------------------------------------------------------------------------------------------

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB

var db = process.env.MONGO_URI || "mongodb://root:root@ds113626.mlab.com:13901/13626/mongoose-news";

  mongoose.Promise = Promise;
//  mongoose.connect('mongodb://localhost/news-goose', {
//  	useMongoClient: true
//  });

  mongoose.connect(db, {
  	useMongoClient: true
  });

// Import the User, Note and Article models
var User = require('./models/User.js');
var Note = require('./models/Notes.js');
var Article = require('./models/Article.js');
// ---------------------------------------------------------------------------------------------------------------

// Import Routes/Controller
//var router = require('./controllers/controller.js');


//var router = express.Router();

// Require controller modules
var User_controller = require('../controllers/userController');
var Article_controller = require('../controllers/articleController');
var Note_controller = require('../controllers/noteController');

// dynamically include routes (Controller)
fs.readdirSync('./controllers').forEach(function (file) {
  if(file.substr(-3) == '.js') {
      router = require('./controllers/' + file);
      router.controller(app);
  }
});
app.use('/', router);

// Launch App
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log('Running on port: ' + port);
});



// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server


// A GET route for scraping the echojs website
app.get("/", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.asahi.com/ajw/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article
        .create(result)
        .then(function(dbArticle) {
          // If we were able to successfully scrape and save an Article, send a message to the client
          res.send("Scrape Complete");
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
  });
}.then(
  // Route for getting all Articles from the db
  app.get("/articles", function(req, res) {
    // TODO: Finish the route so it grabs all of the articles
    db.Articles
      .find({})
      .then(function(dbArticle){
        res.json(dbArticle)
      }).catch(function(err){
        res.json(err);
      });
  });
);



// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
   db.Articles
    .find({})
    .populate("note")
    .then(function(dbArticle){
      res.json(dbArticle)
    }).catch(function(err){
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.Articles
  .create(req.body)
  .then(function(dbArticle){
    return db.Article.findOneAndUpDate({}, {$push:{notes:dbNote._id}}, {new: true});
  }).catch(function(err){
    res.json(err);
  })
});

// POST route for saving a new Book to the db and associating it with a Library
app.post("/submit", function(req, res) {
  // Create a new Book in the database
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Book was created successfully, find one library (there's only one) and push the new Book's _id to the Library's `books` array
      // { new: true } tells the query that we want it to return the updated Library -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Note.findOneAndUpdate({}, { $push: { books: dbBook._id } }, { new: true });
    })
    .then(function(dbLibrary) {
      // If the Library was updated successfully, send it back to the client
      res.json(dbLibrary);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
