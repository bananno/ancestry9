const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
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

methods.toSharedObject = function({imageMap}) {
  const {exportFieldNames} = this.constants();
  const source = tools.reduceToExportData(this, exportFieldNames);

  // Remove non-shared people and then un-populate people.
  source.people = source.people
    .filter(person => person.isPublic())
    .map(person => person._id);

  // Use story to create full title and then un-populate story.
  source.populateFullTitle();
  source.story = source.story._id;

  source.tags = tools.convertTags(this);

  // Populate images manually; otherwise image tags would not be populated.
  // No need to un-populate images because they only exist as attributes
  // of their parent story or source.
  source.images = source.images.map(imageId => imageMap[imageId].toSharedObject());

  return source;
}

// Must populate story first
methods.populateFullTitle = function() {
  this.fullTitle = `${this.story.title} - ${this.title}`;
};


// =============================== citations

methods.populateCitations = async function() {
  const Citation = mongoose.model('Citation');
  this.citations = await Citation.find({source: this}).populate('person');
};

methods.populateAndSortCitations = async function() {
  const Citation = mongoose.model('Citation');
  await this.populateCitations();
  this.citationsByPerson = [...this.citations];
  Citation.sortByItem(this.citations, this.people);
  Citation.sortByPerson(this.citationsByPerson, this.people);
};

// Populate citations for this source, but only for one person.
// Used for person profile routes.
methods.populatePersonCitations = async function(person) {
  this.citations = await mongoose.model('Citation').find({source: this, person});
};

methods.getFastCitationToDoList = function() {
  const existingCitations = {};
  const toDoList = [];

  const sourceYear = this.date && this.date.year ? this.date.year + ' - ' : '';

  let residence = '';

  this.citations.forEach(citation => {
    let key = citation.person._id + citation.item;
    existingCitations[key] = true;

    if (citation.item == 'residence') {
      residence = citation.information;
    }
  });

  const censusItemsForParents = [
    'number of children',
    'father - birthplace',
    'mother - birthplace',
    'marriage - date',
  ];

  const citationItems = ['name'];

  if (this.story.title.match('Census')) {
    citationItems.push('birth - date');
    citationItems.push('birth - place');
    citationItems.push('residence');
    citationItems.push('occupation');
    censusItemsForParents.forEach(item => citationItems.push(item));
  } else if (this.story.type == 'cemetery') {
    citationItems.push('birth - date');
    citationItems.push('death - date');
  } else {
    citationItems.push('birth - date');
    citationItems.push('birth - place');
    citationItems.push('death - date');
    citationItems.push('death - place');
  }

  citationItems.forEach(item => {
    this.people.forEach((person, i) => {
      if (i > 0 && ['occupation'].includes(item)) {
        return;
      }

      if (i > 1 && censusItemsForParents.includes(item)) {
        return;
      }

      let key = person._id + item;
      if (existingCitations[key]) {
        return;
      }

      let value = '';
      if (item == 'residence') {
        value = residence || sourceYear;
      } else if (['occupation', 'number of children'].includes(item)) {
        value = sourceYear;
      }

      toDoList.push([person, item, value]);
    });
  });

  return toDoList;
};


// =============================== highlights

methods.populateHighlights = async function() {
  const Highlight = mongoose.model('Highlight');
  this.highlights = await Highlight.find({source: this})
    .populate('linkPerson')
    .populate('linkStory');
}

methods.populateAndProcessHighlights = async function() {
  if (!this.content) {
    return;
  }
  const Highlight = mongoose.model('Highlight');
  await this.populateHighlights();
  this.highlightedContent = Highlight.processForContent(this.content, this.highlights);
};

// =============================== notations

// Get official text about source origin (e.g., MLA) via notations; NOT the citation model.
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

// Populate notations for this source.
// Sort notations into categories for the notations view.
methods.populateNotationsInCategories = async function() {
  const Notation = mongoose.model('Notation');

  this.notations = await Notation.find({source: this})
    .populate('people')
    .populate('stories');

  this.notationGroups = {
    citations: [],
    excerpts: [],
    other: [],
  };

  this.notations.forEach(notation => {
    if (notation.title === 'source citation') {
      this.notationGroups.citations.push(notation);
    } else if (notation.title === 'excerpt' || notation.hasTag('excerpt')) {
      this.notationGroups.excerpts.push(notation);
    } else {
      this.notationGroups.other.push(notation);
    }
  });
};


// =============================== people

// Get a list of people that are NOT attached to this source but are associated
// through a citation or a highlight. List contains no duplicates and is sorted
// by name.
methods.getAssociatedPeople = async function() {
  const extraCitations = await mongoose.model('Citation').find({
    source: this,
    person: {$nin: this.people}
  });
  const extraHighlights = await mongoose.model('Highlight').find({
    source: this,
    linkPerson: {$ne: null, $nin: this.people}
  });
  const associatedPersonIds = [
    ...extraCitations.map(citation => citation.person),
    ...extraHighlights.map(highlight => highlight.linkPerson),
  ];

  const Person = mongoose.model('Person');
  const people = await Person.find({_id: {$in: associatedPersonIds}});
  Person.sortByName(people);

  return people;
}

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

  if (!this.citations) {
    await this.populateCitations();
  }

  this.citations.forEach(({person}) => {
    if (!isPersonCovered(person)) {
      additionalPeople.push(person);
      remainingPeople = Person.removeFromList(remainingPeople, person);
      setPersonCovered(person);
    }
  });

  if (!this.highlights) {
    await this.populateHighlights();
  }

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

// Get a list of all attached & associated people for this source.
// Populate this source's citations and highlights for each person.
methods.getPeopleForHighlightCitationComparison = async function() {
  const Citation = mongoose.model('Citation');
  const Highlight = mongoose.model('Highlight');

  const additionalPeople = await this.getAssociatedPeople();
  const people = [...this.people, ...additionalPeople];

  for (let i in people) {
    const person = people[i];
    person.citations = await Citation.find({person, source: this});
    person.highlights = await Highlight.find({linkPerson: person, source: this});
    Citation.sortByItem(person.citations);
  }

  return people;
}

// =============================== stories

methods.populateStory = async function() {
  if (!this.story.title) {
    this.story = await mongoose.model('Story').findById(this.story);
  }
};
