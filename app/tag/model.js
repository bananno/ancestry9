const mongoose = require('mongoose');
const tools = require('../tools/modelTools');

const tagSchema = new mongoose.Schema({
  title: String,
  definition: String,
  tags: [{
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
    },
    value: String
  }],
});

mongoose.model('Tag', tagSchema);
