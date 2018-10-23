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
  },
});

mongoose.model('Event', eventSchema);
