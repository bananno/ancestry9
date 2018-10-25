var mongoose = require('mongoose');
var dateStructure = require('./date.js');
var locationStructure = require('./location.js');

var sourceSchema = new mongoose.Schema({
  type: String,
  group: String,
  title: String,
  date: dateStructure,
  location: locationStructure,
  people: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  links: [String],
  images: [String],
  content: String,
});

mongoose.model('Source', sourceSchema);
