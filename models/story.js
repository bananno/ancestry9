const mongoose = require('mongoose');
const dateStructure = require('./dateStructure.js');
const locationStructure = require('./locationStructure.js');

const storySchema = new mongoose.Schema({
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
  tags: [String],
  content: String,
  notes: String,
  summary: String,
  sharing: { type: Boolean, default: false },
});

mongoose.model('Story', storySchema);
