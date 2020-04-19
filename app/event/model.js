const mongoose = require('mongoose');
const tools = require('../tools/modelTools');

const eventSchema = new mongoose.Schema({
  title: String,
  date: tools.dateStructure,
  location: tools.locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  notes: String,
  tags: [String],
});

eventSchema.statics.sortByDate = tools.sortByDate;

mongoose.model('Event', eventSchema);
