const mongoose = require('mongoose');
const tools = require('./tools');
const dateStructure = require('./dateStructure');
const locationStructure = require('./locationStructure');

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

eventSchema.statics.sortByDate = tools.sortByDate;

mongoose.model('Event', eventSchema);
