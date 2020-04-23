const mongoose = require('mongoose');
const constants = require('./constants');
const tools = require('../tools/modelTools');
const instanceMethods = require('./model-instance');
const staticMethods = require('./model-static');

const storySchema = new mongoose.Schema({
  type: String,
  title: String,
  date: tools.dateStructure,
  location: tools.locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
  }],
  tags: [String],
  content: String,
  notes: String,
  summary: String,
  sharing: { type: Boolean, default: false },
});

for (let methodName in instanceMethods) {
  storySchema.methods[methodName] = instanceMethods[methodName];
}

for (let methodName in staticMethods) {
  storySchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Story', storySchema);
