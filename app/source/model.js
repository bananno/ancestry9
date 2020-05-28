const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const instanceMethods = require('./model-instance');
const staticMethods = require('./model-static');

const sourceSchema = new mongoose.Schema({
  title: String,
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  },
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  }],
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
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  tagValues: [String],
  content: String,
  notes: String,
  summary: String,
  sharing: { type: Boolean, default: false },
});

for (let methodName in instanceMethods) {
  sourceSchema.methods[methodName] = instanceMethods[methodName];
}

for (let methodName in staticMethods) {
  sourceSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Source', sourceSchema);
