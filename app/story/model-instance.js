const {pick} = require('lodash');
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
  return {
    id: String(this._id),
    ...pick(this, ['title', 'type', 'date', 'location', 'summary']),
    personIds: this.people.filter(person => person.isPublic()).map(person => person._id),
    // Populate images manually; otherwise image tags would not be populated.
    // Images because they only exist as attributes of their parent story or source.
    images: this.images.map(imageId => imageMap[imageId].toSharedObject()),
    tags: this.convertTags(),
    links: this.links.map(link => {
      const arr = link.split(' ');
      return {url: arr.shift(), text: arr.join(' ')};
    }),
    notes: this.notes?.split('\n') || [],
    content: this.content?.split('\n') || [],
  };
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
