const mongoose = require('mongoose');

const notationSchema = new mongoose.Schema({
  title: String,
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
  },
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  }],
  tags: [String],
  text: String,
  sharing: { type: Boolean, default: false },
});

mongoose.model('Notation', notationSchema);
