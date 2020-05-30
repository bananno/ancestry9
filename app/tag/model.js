const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const instanceMethods = require('./model-instance');
const staticMethods = require('./model-static');

const tagSchema = new mongoose.Schema({
  title: String,
  definition: String,
  valueType: {
    type: Number,
    default: 0
  },
  values: String,
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  tagValues: [String],
});

for (let methodName in instanceMethods) {
  tagSchema.methods[methodName] = instanceMethods[methodName];
}

for (let methodName in staticMethods) {
  tagSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Tag', tagSchema);
