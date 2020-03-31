const mongoose = require('mongoose');
const dateStructure = require('./dateStructure.js');
const locationStructure = require('./locationStructure.js');

const storySchema = new mongoose.Schema({
  type: String,
  title: String,
  date: dateStructure,
  location: locationStructure,
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

// ----------------------------------------

mongoose.model('Story', storySchema);
