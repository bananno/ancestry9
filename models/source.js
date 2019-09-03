const mongoose = require('mongoose');
const dateStructure = require('./dateStructure.js');
const locationStructure = require('./locationStructure.js');

const sourceSchema = new mongoose.Schema({
  title: String,
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  },
  date: dateStructure,
  location: locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  images: [String],
  tags: [String],
  content: String,
  notes: String,
  summary: String,
  sharing: { type: Boolean, default: false },
});

mongoose.model('Source', sourceSchema);
