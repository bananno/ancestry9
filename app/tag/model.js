const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const staticMethods = require('./model-static');

const tagSchema = new mongoose.Schema({
  title: String,
  definition: String,
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  tagValues: [String],
});

for (let methodName in staticMethods) {
  tagSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Tag', tagSchema);
