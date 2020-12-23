const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

methods.getTagTitles = tools.getTagTitles;
methods.getTagValue = tools.getTagValue;
methods.hasTag = tools.hasTag;

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

// Get list of people sorted for the dropdown for creating new citations,
// creating new highlights, or attaching additional people for this source.
// Contains all people in the database in a specific order:
//   1. People attached to the source, in the order of attachment.
//   2. People that are not attached but who have a citation or highlight here already.
//   3. Everyone else, in alphabetical order.
methods.getPeopleForDropdown = async function() {
  const Person = mongoose.model('Person');
  const personRef = {};

  let remainingPeople = await Person.find({});

  this.people.forEach(person => {
    remainingPeople = Person.removeFromList(remainingPeople, person);
    setPersonCovered(person);
  });

  const additionalPeople = [];

  this.citations.forEach(({person}) => {
    if (!isPersonCovered(person)) {
      additionalPeople.push(person);
      remainingPeople = Person.removeFromList(remainingPeople, person);
      setPersonCovered(person);
    }
  });

  this.highlights.forEach(({linkPerson}) => {
    if (linkPerson && !isPersonCovered(linkPerson)) {
      additionalPeople.push(linkPerson);
      remainingPeople = Person.removeFromList(remainingPeople, linkPerson);
      setPersonCovered(linkPerson);
    }
  });

  Person.sortByName(additionalPeople);
  Person.sortByName(remainingPeople);

  const unlinkedPeople = [...additionalPeople, ...remainingPeople];
  const allPeople = [...this.people, ...unlinkedPeople];

  return {allPeople, unlinkedPeople};

  function isPersonCovered(person) {
    return personRef['' + (person._id || person)];
  }
  function setPersonCovered(person) {
    personRef['' + (person._id || person)] = true;
  }
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

methods.populateHighlights = async function() {
  const Highlight = mongoose.model('Highlight');
  this.highlights = await Highlight.find({source: this}).populate('linkPerson');
}

methods.populateAndProcessHighlights = async function() {
  const Highlight = mongoose.model('Highlight');
  await this.populateHighlights();
  this.highlightedContent = Highlight.processForContent(this.content, this.highlights);
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

methods.toSharedObject = function({imageMap}) {
  const source = tools.reduceToExportData(this, constants.fieldNames);

  // Remove non-shared people and then un-populate people.
  source.people = source.people
    .filter(person => person.isPublic())
    .map(person => person._id);

  // Use story to create full title and then un-populate story.
  source.fullTitle = source.story.title + ' - ' + source.title;
  source.story = source.story._id;

  source.tags = tools.convertTags(this);

  // Populate images manually; otherwise image tags would not be populated.
  // No need to un-populate images because they only exist as attributes
  // of their parent story or source.
  source.images = source.images.map(imageId => imageMap[imageId].toSharedObject());

  return source;
}
