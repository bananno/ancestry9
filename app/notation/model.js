const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const instanceMethods = require('./model-instance');
const staticMethods = require('./model-static');

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
  date: tools.dateStructure,
  location: tools.locationStructure,
  tags: [String],
  text: String,
  sharing: { type: Boolean, default: false },
});

for (let methodName in instanceMethods) {
  notationSchema.methods[methodName] = instanceMethods[methodName];
}

for (let methodName in staticMethods) {
  notationSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Notation', notationSchema);
