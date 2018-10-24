var mongoose = require('mongoose');

var sourceSchema = new mongoose.Schema({
  type: String,
  group: String,
  title: String,
  date: {
    year: { type: Number, default: 0},
    month: { type: Number, default: 0},
    day: { type: Number, default: 0},
  },
  people: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  links: [String],
  images: [String],
  content: String,
});

mongoose.model('Source', sourceSchema);
