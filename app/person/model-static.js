const mongoose = require('mongoose');
const methods = {};
module.exports = methods;

methods.populateConnections = require('./populateConnections');
methods.populateAncestors = populateAncestors;
methods.findInList = findInList;
methods.isSame = isSame;

async function populateAncestors(personId, people, safety) {
  safety = safety || 0;

  if (safety > 30) {
    return personId;
  }

  const person = findInList(people, personId);

  for (let i in person.parents) {
    person.parents[i] = await populateAncestors(person.parents[i], people, safety + 1);
  }

  return person;
}

// Given list of people, populate all parents/spouses/children.
methods.populateRelatives = function(people) {
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
};

// Given list of people, populate birth and death events for each.
methods.populateBirthAndDeath = async function(people) {
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
};

function findInList(people, person) {
  return people.find(nextPerson => isSame(person, nextPerson));
}

function isSame(person1, person2) {
  const id1 = '' + (person1 ? (person1._id || person1) : 'null');
  const id2 = '' + (person2 ? (person2._id || person2) : 'null');
  return id1 === id2;
}

methods.removeFromList = function(people, person) {
  return people.filter(nextPerson => !isSame(person, nextPerson));
};

methods.sortByName = function(people) {
  people.sort((a, b) => a.name < b.name ? -1 : 1);
};

methods.getAllCountriesOfOrigin = people => {
  const countries = {};
  people.filter(person => person.tags.country).forEach(person => {
    person.tags.country.split(',').forEach(country => {
      countries[country.trim()] = true;
    });
  });
  return Object.keys(countries).sort();
};
