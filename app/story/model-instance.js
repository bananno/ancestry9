const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

// Return list of sources that belong to THIS story.
methods.getEntries = async function() {
  const entries = await mongoose.model('Source').find({story: this});
  entries.forEach(entry => entry.story = this);
  return entries;
};

// Assign list of sources that belong to THIS story.
methods.populateEntries = async function() {
  this.entries = this.getEntries();
};

methods.toSharedObject = function() {
  const story = tools.reduceToExportData(this, constants.fieldNames);

  // Remove non-shared people and then un-populate people.
  story.people = story.people
    .filter(person => person.isPublic())
    .map(person => person._id);

  // No need to un-populate images because they only exist as attributes
  // of their parent story or source.
  story.images = story.images.map(image => image.toSharedObject());

  return story;
}
