const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

methods.getTagTitles = tools.getTagTitles;
methods.getTagValue = tools.getTagValue;
methods.hasTag = tools.hasTag;
methods.convertTags = tools.convertTags2;

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
methods.getEntries = async function(options = {}) {
  const entries = options.populateImages
    ? await mongoose.model('Source').find({story: this}).populate('images')
    : await mongoose.model('Source').find({story: this});
  entries.forEach(entry => entry.story = this);
  return entries;
};

// Whether to show a checklist view as one of the story's subtabs.
methods.hasChecklist = function() {
  return this.hasTag('has own checklist');
};

methods.toSharedObject = function({imageMap}) {
  const {exportFieldNames} = this.constants();
  const story = tools.reduceToExportData(this, exportFieldNames);

  // Remove non-shared people and then un-populate people.
  story.people = story.people
    .filter(person => person.isPublic())
    .map(person => person._id);

  story.tags = tools.convertTags(this);

  // Populate images manually; otherwise image tags would not be populated.
  // No need to un-populate images because they only exist as attributes
  // of their parent story or source.
  story.images = story.images.map(imageId => imageMap[imageId].toSharedObject());

  return story;
}


// =============================== highlights

methods.populateHighlightMentions = async function() {
  this.mentions = await mongoose.model('Highlight')
    .getMentionsForItem({linkStory: this});
};


// =============================== notations

methods.populateNotations = async function() {
  this.notations = await mongoose.model('Notation').find({stories: this});
};


// =============================== notation cite text (unrelated to citation model)

// Get official text about story origin (e.g., MLA) NOT the citation model.
methods.populateCiteText = async function() {
  const notations = await mongoose.model('Notation').getCitesForStory(this);
  this.citeText = notations.map(notation => notation.text);
};

methods.shouldHaveCiteText = async function() {
  return !['event', 'place'].includes(this.type);
};


// =============================== sources

// Assign list of sources that belong to THIS story.
methods.populateEntries = async function(options) {
  this.entries = await this.getEntries(options);
};

// Assign list of sources that are attached to this story, but don't belong to it.
methods.populateNonEntrySources = async function() {
  this.nonEntrySources = await mongoose.model('Source')
    .find({stories: this}).populate('story');
};
