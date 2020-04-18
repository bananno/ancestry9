const mongoose = require('mongoose');
const tools = require('./tools');

const personSchema = new mongoose.Schema({
  name: String,
  customId: String,
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  spouses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  tags: [String],
  profileImage: String,
  gender: Number,
  sharing: {
    level: { type: Number, default: 0 },
    name: { type: String, default: '' },
  },
});

personSchema.methods.getLifeEvents = getLifeEvents;
personSchema.methods.isLiving = isLiving;
personSchema.methods.populateBirthAndDeath = populateBirthAndDeathSingle;
personSchema.methods.populateSiblings = populateSiblings;

personSchema.statics.populateConnections = tools.personPopulateConnections;
personSchema.statics.populateAncestors = populateAncestors;
personSchema.statics.populateRelatives = populateRelatives;
personSchema.statics.populateBirthAndDeath = populateBirthAndDeathList;
personSchema.statics.findInList = findInList;
personSchema.statics.isSame = isSame;
personSchema.statics.removeFromList = removeFromList;
personSchema.statics.sortByName = sortByName;

const Person = mongoose.model('Person', personSchema);

async function getLifeEvents() {
  const Event = mongoose.model('Event');
  const events = await Event.find({people: this}).populate('people');
  Event.sortByDate(events);
  return events;
}

function isLiving() {
  return this.tags.includes('living');
}

async function populateBirthAndDeathSingle() {
  const Event = mongoose.model('Event');

  this.birth = await Event.findOne({title: 'birth', people: this});
  this.death = await Event.findOne({title: 'death', people: this});

  if (!this.birth && !this.death) {
    const double = await Event.findOne({title: 'birth and death', people: this});
    if (double) {
      this.birth = double;
      this.death = double;
    }
  }
}

async function populateSiblings() {
  const done = {};
  done[this._id] = true;

  this.siblings = [];

  for (let parentIndex in this.parents) {
    const parent = this.parents[parentIndex];

    for (let childIndex in parent.children) {
      const childId = parent.children[childIndex];

      if (done[childId]) {
        continue;
      }

      done[childId] = true;
      const sibling = await Person.findById(childId);
      this.siblings.push(sibling);
    }
  }
}

async function populateAncestors(personId, people, safety) {
  safety = safety || 0;

  if (safety > 30) {
    return personId;
  }

  const person = Person.findInList(people, personId);

  for (let i in person.parents) {
    person.parents[i] = await populateAncestors(person.parents[i], people, safety + 1);
  }

  return person;
}

// Given list of people, populate all parents/spouses/children.
function populateRelatives(people) {
  const personRef = {};

  people.forEach(person => personRef[person._id] = person);

  people.forEach(person => {
    ['parents', 'children', 'spouses'].forEach(rel => {
      // .map() throws stack size error for some reason
      for (let i in person[rel]) {
        if (!person[rel][i].name) {
          person[rel][i] = personRef[person[rel][i]];
        }
      }
    });
  })
}

// Given list of people, populate birth and death events for each.
async function populateBirthAndDeathList(people) {
  const Event = mongoose.model('Event');

  const births = await Event.find({title: 'birth'});
  const deaths = await Event.find({title: 'death'});
  const combos = await Event.find({title: 'birth and death'});

  const birthsMap = {};
  const deathsMap = {};

  [...births, ...combos].forEach(event => {
    event.people.forEach(person => birthsMap[person] = event);
  });

  [...deaths, ...combos].forEach(event => {
    event.people.forEach(person => deathsMap[person] = event);
  });

  people.forEach(person => {
    person.birth = birthsMap[person._id];
    person.death = deathsMap[person._id];
  });

  // Old version: causes stack overflow if people data are too populated;
  // see checklist/vitals.
  // for (let i in people) {
  //   await people[i].populateBirthAndDeath();
  // }
}

function findInList(people, person) {
  return people.find(nextPerson => isSame(person, nextPerson));
}

function isSame(person1, person2) {
  const id1 = '' + (person1 ? (person1._id || person1) : 'null');
  const id2 = '' + (person2 ? (person2._id || person2) : 'null');
  return id1 === id2;
}

function removeFromList(people, person) {
  return people.filter(nextPerson => !isSame(person, nextPerson));
}

function sortByName(people) {
  people.sort((a, b) => a.name < b.name ? -1 : 1);
}
