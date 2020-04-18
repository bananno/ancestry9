const mongoose = require('mongoose');
const tools = require('../modelTools');

const sourceSchema = new mongoose.Schema({
  title: String,
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  },
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  }],
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

sourceSchema.methods.canBeDeleted = canBeDeleted;
sourceSchema.methods.canBeShared = canBeShared;
sourceSchema.methods.canHaveDate = canHaveDate;
sourceSchema.methods.canHaveLocation = canHaveLocation;
sourceSchema.methods.getPeopleForNewCitations = getPeopleForNewCitations;
sourceSchema.methods.populateCitations = populateCitations;
sourceSchema.methods.populateCiteText = populateCiteTextSingle;
sourceSchema.methods.populatePersonCitations = populatePersonCitations;
sourceSchema.methods.populateStory = populateStory;

sourceSchema.statics.populateCiteText = populateCiteTextList;

sourceSchema.statics.sortByStory = function(sources) {
  tools.sortBy(sources, source => {
    return [source.story.type, source.story.title, source.title].join(' - ');
  });
};

mongoose.model('Source', sourceSchema);

function canBeDeleted() {
  return this.people.length === 0
    && (this.links || []).length === 0
    && (this.images || []).length === 0
    && (this.tags || []).length === 0
    && (this.citations || []).length === 0
    && (this.notes || '').length === 0
    && (this.summary || '').length === 0
    && (this.content || '').length === 0;
}

function canBeShared() {
  return this.story.sharing;
}

function canHaveDate() {
  return (this.story.type && !['cemetery'].includes(this.story.type))
    || (this.date && (this.date.year || this.date.month
      || this.date.day || this.date.display));
}

function canHaveLocation() {
  return (this.story.type
      && !['cemetery', 'newspaper'].includes(this.story.type))
    || (this.location && (this.location.country || this.location.region1
      || this.location.region2 || this.location.city
      || this.location.notes));
}

// Get list of people sorted for the dropdown for creating new citations:
//   1. People attached to the source, in the order of attachment.
//   2. People that are not attached but who have a citation here already.
//   3. Everyone else, in alphabetical order.
async function getPeopleForNewCitations() {
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
}

async function populateCitations() {
  const Citation = mongoose.model('Citation');
  this.citations = await Citation.find({source: this}).populate('person');
}

// Get official text about source origin (e.g., MLA) NOT the citation model.
async function populateCiteTextSingle(options = {}) {
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
}

async function populatePersonCitations(person) {
  this.citations = await mongoose.model('Citation').find({source: this, person});
}

async function populateStory() {
  if (!this.story.title) {
    this.story = await mongoose.model('Story').findById(this.story);
  }
}

async function populateCiteTextList(sources) {
  for (let i in sources) {
    await sources[i].populateCiteText();
  }
}
