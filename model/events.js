var mongoose = require('mongoose');

var eventSchema = new mongoose.Schema({
  title: String,
  date: { type: Date, default: null },
  persons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }]
});

mongoose.model('Event', eventSchema);
