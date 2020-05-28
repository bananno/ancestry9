const mongoose = require('mongoose');
const instanceMethods = require('./model-instance');
const staticMethods = require('./model-static');

const imageSchema = new mongoose.Schema({
  url: String,
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  tagValues: [String],
  // Image actually belows to either a source or story.
});

for (let methodName in instanceMethods) {
  imageSchema.methods[methodName] = instanceMethods[methodName];
}

for (let methodName in staticMethods) {
  imageSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Image', imageSchema);
