const mongoose = require('mongoose');

const notationSchema = new mongoose.Schema({
  title: String,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  tags: [String],
  text: String,
  sharing: { type: Boolean, default: false },
});

mongoose.model('Notation', notationSchema);
