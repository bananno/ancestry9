const mongoose = require('mongoose');
const dateStructure = require('./dateStructure.js');
const locationStructure = require('./locationStructure.js');

const eventSchema = new mongoose.Schema({
  title: String,
  date: dateStructure,
  location: locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  notes: String,
  tags: [String],
});

mongoose.model('Event', eventSchema);
