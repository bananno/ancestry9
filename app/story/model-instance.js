const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

methods.canHaveDate = function() {
  return this.type !== 'cemetery';
};

methods.canHaveEntries = function() {
  return !constants.noEntryStoryTypes.includes(this.type);
};

methods.entriesCanHaveDate = function() {
  return this.type !== 'cemetery';
};

methods.entriesCanHaveLocation = function() {
  return !['cemetery', 'newspaper'].includes(this.type);
};

// Return list of sources that belong to THIS story.
methods.getEntries = async function() {
  const entries = await mongoose.model('Source').find({story: this});
  entries.forEach(entry => entry.story = this);
  return entries;
};

// Get official text about story origin (e.g., MLA) NOT the citation model.
methods.populateCiteText = async function() {
  const notations = await mongoose.model('Notation').getCitesForStory(this);
  this.citeText = notations.map(notation => notation.text);
};

// Assign list of sources that belong to THIS story.
methods.populateEntries = async function() {
  this.entries = await this.getEntries();
};

// Assign list of sources that are attached to this story, but don't belong to it.
methods.populateNonEntrySources = async function() {
  this.nonEntrySources = await mongoose.model('Source')
    .find({stories: this}).populate('story');
};

methods.populateNotations = async function() {
  this.notations = await mongoose.model('Notation').find({stories: this});
};

methods.shouldHaveCiteText = async function() {
  return !['event', 'place'].includes(this.type);
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
