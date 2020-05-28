const mongoose = require('mongoose');
const tools = require('../tools/modelTools');

const tagSchema = new mongoose.Schema({
  title: String,
  definition: String,
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  tagValues: [String],
});

mongoose.model('Tag', tagSchema);
