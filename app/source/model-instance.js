const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

methods.canBeDeleted = function() {
  return this.people.length === 0
    && (this.links || []).length === 0
    && (this.images || []).length === 0
    && (this.tags || []).length === 0
    && (this.citations || []).length === 0
    && (this.notes || '').length === 0
    && (this.summary || '').length === 0
    && (this.content || '').length === 0;
};

methods.canBeShared = function() {
  return this.story.sharing;
};

methods.canHaveDate = function() {
  return (this.story.type && !['cemetery'].includes(this.story.type))
    || (this.date && (this.date.year || this.date.month
      || this.date.day || this.date.display));
};

methods.canHaveLocation = function() {
  return (this.story.type
      && !['cemetery', 'newspaper'].includes(this.story.type))
    || (this.location && (this.location.country || this.location.region1
      || this.location.region2 || this.location.city
      || this.location.notes));
};

// Get list of people sorted for the dropdown for creating new citations
// for this source. Contains all people in the database in a specific order:
//   1. People attached to the source, in the order of attachment.
//   2. People that are not attached but who have a citation here already.
//   3. Everyone else, in alphabetical order.
methods.getPeopleForNewCitations = async function() {
  const Person = mongoose.model('Person');

  let remainingPeople = await Person.find({});

  this.people.forEach(thisPerson => {
    remainingPeople = Person.removeFromList(remainingPeople, thisPerson);
  });

  Person.sortByName(remainingPeople);

  const citationsPeople = [];

  this.citations.forEach(({person}) => {
    if (!citationsPeople.includes(person)) {
      citationsPeople.push(person);
      remainingPeople = Person.removeFromList(remainingPeople, person);
    }
  });

  return [...this.people, ...citationsPeople, ...remainingPeople];
};

methods.populateCitations = async function() {
  const Citation = mongoose.model('Citation');
  this.citations = await Citation.find({source: this}).populate('person');
};

// Get official text about source origin (e.g., MLA) NOT the citation model.
methods.populateCiteText = async function(options = {}) {
  const sourceNotations = await mongoose.model('Notation')
    .getCitesForSource(this);

  let notations = [...sourceNotations];

  if (options.includeStory !== false) {
    const storyNotations = await mongoose.model('Notation')
      .getCitesForStory(this.story);

    if (options.storyFirst) {
      notations = [...storyNotations, ...notations];
    } else {
      notations = [...notations, ...storyNotations];
    }
  }

  this.citeText = notations.map(notation => notation.text);
};

// Populate citations for this source, but only for one person.
// Used for person profile routes.
methods.populatePersonCitations = async function(person) {
  this.citations = await mongoose.model('Citation').find({source: this, person});
};

methods.populateStory = async function() {
  if (!this.story.title) {
    this.story = await mongoose.model('Story').findById(this.story);
  }
};

methods.toSharedObject = function() {
  const source = tools.reduceToExportData(this, constants.fieldNames);

  // Remove non-shared people and then un-populate people.
  source.people = source.people
    .filter(person => person.isPublic())
    .map(person => person._id);

  // Use story to create full title and then un-populate story.
  source.fullTitle = source.story.title + ' - ' + source.title;
  source.story = source.story._id;

  // No need to un-populate images because they only exist as attributes
  // of their parent story or source.
  source.images = source.images.map(image => image.toSharedObject());

  return source;
}
