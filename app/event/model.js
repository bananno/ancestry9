const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const instanceMethods = require('./model-instance');
const staticMethods = require('./model-static');

const eventSchema = new mongoose.Schema({
  title: String,
  date: tools.dateStructure,
  location: tools.locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  notes: String,
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  tagValues: [String],
});

for (let methodName in instanceMethods) {
  eventSchema.methods[methodName] = instanceMethods[methodName];
}

for (let methodName in staticMethods) {
  eventSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Event', eventSchema);
