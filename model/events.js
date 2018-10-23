var mongoose = require('mongoose');

var eventSchema = new mongoose.Schema({
  title: String,
  date: {
    year: { type: Number, default: 0},
    month: { type: Number, default: 0},
    day: { type: Number, default: 0},
  },
  people: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  location: {
    country: String,
    region1: String, // province or state
    region2: String, // county
    city: String,
    notes: String,
  },
});

mongoose.model('Event', eventSchema);
