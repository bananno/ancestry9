const mongoose = require('mongoose');
const instanceMethods = require('./model-instance');
const staticMethods = require('./model-static');

const personSchema = new mongoose.Schema({
  name: String,
  customId: String,
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  spouses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  tags: [String],
  profileImage: String,
  gender: Number,
  sharing: {
    level: { type: Number, default: 0 },
    name: { type: String, default: '' },
  },
});

for (let methodName in instanceMethods) {
  personSchema.methods[methodName] = instanceMethods[methodName];
}

for (let methodName in staticMethods) {
  personSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Person', personSchema);
