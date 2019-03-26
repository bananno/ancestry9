const mongoose = require('mongoose');
const dateStructure = require('./date.js');
const locationStructure = require('./location.js');

const sourceSchema = new mongoose.Schema({
  type: String,
  group: String,
  title: String,
  date: dateStructure,
  location: locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  images: [String],
  content: String,
  notes: String,
});

mongoose.model('Source', sourceSchema);
