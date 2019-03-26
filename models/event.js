var mongoose = require('mongoose');
var dateStructure = require('./date.js');
var locationStructure = require('./location.js');

var eventSchema = new mongoose.Schema({
  title: String,
  date: dateStructure,
  location: locationStructure,
  people: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  notes: String,
});

mongoose.model('Event', eventSchema);
