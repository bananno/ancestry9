const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

methods.populateConnections = require('./populateConnections');
methods.populateAncestors = populateAncestors;
methods.findInList = findInList;
methods.isSame = isSame;

methods.getAllSharedData = async () => {
  const rawPeople = await mongoose.model('Person').find({});
  const ancestors = {};

  const anna = rawPeople.find(person => person.name === 'Anna Peterson');

  anna.parents.forEach((person, i) => findAncestors(person, i + 1, 1));

  function findAncestors(personId, treeSide, degree) {
    personId += '';
    ancestors[personId] = [treeSide, degree];
    const person = rawPeople.find(person => person._id + '' == personId);
    person.parents.forEach(parent => findAncestors(parent, treeSide, degree + 1));
  }

  const people = rawPeople.map(personInfo => {
    if (personInfo.shareLevel == 0) {
      return null;
    }

    let person = {};

    constants.fieldNamesEveryone.forEach(key => {
      person[key] = personInfo[key];
    });

    person._id += '';

    if (ancestors[person._id]) {
      person.leaf = ancestors[person._id][0];
      person.degree = ancestors[person._id][1];
    }

    if (personInfo.shareLevel == 1) {
      person.private = true;
      person.name = personInfo.shareName || 'Person';
      person.customId = personInfo._id;
      person.tags = {};
      return person;
    }

    person.private = false;

    constants.fieldNamesShared.forEach(key => {
      person[key] = personInfo[key];
    });

    person.tags = tools.convertTags(personInfo);

    return person;
  }).filter(Boolean);

  people.forEach(person => {
    if (person.tags['number of children'] == 'done') {
      // some children might not be shared and will be removed from list later
      person.tags['number of children'] = person.children.length;
    } else if (person.tags['number of children'] == 'too distant'
        || person.tags['number of children'] == 'unknown') {
      person.tags['number of children'] = null;
    }
  });

  return people;
};

methods.getFormDataNew = req => {
  const personName = req.body.name.trim();

  if (!personName) {
    return false;
  }

  const newPerson = {
    name: personName,
    gender: req.body.gender,
  };

  newPerson.customId = personName
    .toLowerCase()
    .replace(/\[|\]|\(|\)|\.|\//g, '')
    .replace(/ /g, '-');

  return newPerson;
};

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
