const mongoose = require('mongoose');
const constants = require('./constants');
const tools = require('../modelTools');

const storySchema = new mongoose.Schema({
  type: String,
  title: String,
  date: tools.dateStructure,
  location: tools.locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
  }],
  tags: [String],
  content: String,
  notes: String,
  summary: String,
  sharing: { type: Boolean, default: false },
});

// --------------- INSTANCE ---------------

// Return list of sources that belong to THIS story.
storySchema.methods.getEntries = async function() {
  const entries = await mongoose.model('Source').find({story: this});
  entries.forEach(entry => entry.story = this);
  return entries;
};

// Assign list of sources that belong to THIS story.
storySchema.methods.populateEntries = async function() {
  this.entries = this.getEntries();
};

// ---------------- STATIC ----------------

// Return a list of stories with given type.
storySchema.statics.getAllByType = async function(type) {
  const Story = mongoose.model('Story');

  if (!type) {
    return await Story.find({});
  }

  if (type == 'other') {
    return await Story.find({type: {$nin: constants.mainStoryTypes}});
  }

  return await Story.find({type});
};

// Return a list of stories with "Census USA ___" title.
storySchema.statics.getAllCensusUSA = async function() {
  return await mongoose.model('Story')
    .find({title: {$regex: 'Census USA.*'}});
};

// Given list of stories, return a list of all their entry sources.
storySchema.statics.getAllEntries = async function(stories) {
  let entries = [];
  for (let i in stories) {
    const nextEntries = await stories[i].getEntries();
    entries = entries.concat(nextEntries);
  }
  return entries;
};

// Sort by type, then title.
storySchema.statics.sortByTypeTitle = function(stories) {
  tools.sortBy(stories, story => story.type + story.title);
};

// ----------------------------------------

mongoose.model('Story', storySchema);
