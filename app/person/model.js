const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const methods = require('./model-methods');
const statics = require('./model-statics');

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

for (let methodName in methods) {
  personSchema.methods[methodName] = methods[methodName];
}

for (let methodName in statics) {
  personSchema.statics[methodName] = statics[methodName];
}

const Person = mongoose.model('Person', personSchema);
