const mongoose = require('mongoose');
const instanceMethods = require('./model-instance');
const staticMethods = require('./model-static');

const citationSchema = new mongoose.Schema({
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
  },
  item: String,
  information: String,
});

for (let methodName in instanceMethods) {
  citationSchema.methods[methodName] = instanceMethods[methodName];
}

for (let methodName in staticMethods) {
  citationSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Citation', citationSchema);
