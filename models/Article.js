var mongoose = require("mongoose");

// This creates a reference to the Schema constructor
var Schema = mongoose.Schema;


// Using Schema constructor, this will create a new ArticleSchema OBJECT

var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  // the note object is storing an id and then the ref links the id to the model. Now, we can store a custom note.
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

// Schema is now the source of the new model 
var Article = mongoose.model("Article", ArticleSchema);


// put a bow on it and send it off
module.exports = Article;



