const mongoose = require('mongoose');
const dateStructure = require('./dateStructure.js');
const locationStructure = require('./locationStructure.js');

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
  date: dateStructure,
  location: locationStructure,
  tags: [String],
  text: String,
  sharing: { type: Boolean, default: false },
});

notationSchema.statics.getCitesForSource = async function(source) {
  return await mongoose.model('Notation').find({
    title: 'source citation',
    source
  });
};

notationSchema.statics.getCitesForStory = async function(story) {
  return await mongoose.model('Notation').find({
    title: 'source citation',
    stories: story
  });
};

mongoose.model('Notation', notationSchema);
