const mongoose = require('mongoose');
const dateStructure = require('./date.js');
const locationStructure = require('./location.js');

const eventSchema = new mongoose.Schema({
  title: String,
  date: dateStructure,
  location: locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  notes: String,
});

mongoose.model('Event', eventSchema);
