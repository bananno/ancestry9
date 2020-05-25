const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
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
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
    },
    value: String
  }],
  tempTags: [String],
});

for (let methodName in staticMethods) {
  eventSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Event', eventSchema);
