const tool = filename => require('../tools/' + filename);

const mongoose = require('mongoose');

module.exports = {
  mongoose,

  Citation: mongoose.model('Citation'),
  Event: mongoose.model('Event'),
  Notation: mongoose.model('Notation'),
  Person: mongoose.model('Person'),
  Source: mongoose.model('Source'),
  Story: mongoose.model('Story'),

  createModelRoutes: tool('createModelRoutes'),
  removeDuplicatesFromList: tool('removeDuplicatesFromList'),
  removePersonFromList: tool('removePersonFromList'),
  sortCitations: tool('sortCitations'),
  sortEvents: tool('sortEvents'),
};
