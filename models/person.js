const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: String,
  customId: String,
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  spouses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  profileImage: String,
  sharing: {
    level: { type: Number, default: 0 },
    name: { type: String, default: '' },
  },
});

mongoose.model('Person', personSchema);
