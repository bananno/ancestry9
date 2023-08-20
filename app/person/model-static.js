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
  const rawPeople = await mongoose.model('Person').find({}).populate('tags');
  const ancestors = {};

  const anna = rawPeople.find(person => person.isRoot());

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

function populateAncestors(rootPerson, people, options = {}, safety = 0) {
  if (safety > 30) {
    return rootPerson;
  }

  const person = rootPerson.name ? rootPerson : findInList(people, rootPerson);

  person.parents.forEach((parent, i) => {
    person.parents[i] = populateAncestors(parent, people, options, safety + 1);
  });

  if (options.intoList) {
    options.intoList.push(person);
  }

  return person;
}

methods.getAncestorTree = async rootPerson => {
  const allPeople = await mongoose.model('Person').find().populate('parents');

  return populate(rootPerson, 0);

  function populate(nextPerson, safety) {
    if (safety > 30) {
      return;
    }

    // The nextPerson param is a person object, but it lacks the
    // populated parents. Find the person in the list to get the parents.
    const treeParents = findInList(allPeople, nextPerson)
      .parents
      .map(parent => populate(parent, safety + 1));

    if (treeParents.length === 1) {
      treeParents.push(null);
    }

    return {
      id: nextPerson._id,
      name: nextPerson.name,
      treeParents,
    };
  };
};

// Given an item, get the list of people that are available to be attached
// to that item to populate dropdown on edit table.
methods.getAvailableForItem = async function(item, fieldName) {
  const Person = mongoose.model('Person');

  // In the case of a marriage event, the spouses should be at the top of the
  // dropdown (if the event has one person, and if that person has a spouse.)
  if (treatAsMarriageEvent()) {
    return getForMarriageEvent();
  }

  // In all other cases, the dropdown should contain all the people not yet
  // attached, sorted by name.
  const peopleAlreadyInList = item[fieldName || 'people'];
  const people = await Person.find({_id: {$nin: peopleAlreadyInList}});
  Person.sortByName(people);
  return people;

  function treatAsMarriageEvent() {
    return item instanceof mongoose.model('Event') &&
      item.title === 'marriage' &&
      item.people.length === 1 &&
      item.people[0].spouses.length > 0;
  }

  async function getForMarriageEvent() {
    const Person = mongoose.model('Person');
    const spouses = await Person.find({_id: {$in: item.people[0].spouses}});
    const idsToIgnore = [item.people[0]._id, ...item.people[0].spouses];
    const remainingPeople = await Person.find({_id: {$nin: idsToIgnore}});
    Person.sortByName(remainingPeople);
    return [...spouses, ...remainingPeople];
  }
};

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
methods.populateBirthAndDeath = async function(people, options = {}) {
  const Event = mongoose.model('Event');

  const births = options.populateBirth === false
    ? []
    : (await Event.find({title: 'birth'}));

  const deaths = options.populateDeath === false
    ? []
    : (await Event.find({title: 'death'}));

  const combos = await Event.find({title: 'birth and death'});

  const birthsMap = {};
  const deathsMap = {};

  [...births, ...combos].forEach(event => {
    event.people.forEach(personId => birthsMap[personId] = event);
  });

  [...deaths, ...combos].forEach(event => {
    event.people.forEach(personId => deathsMap[personId] = event);
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

// Given list, create a map of id to person.
methods.createMap = peopleList => {
  const map = {};
  peopleList.forEach(person => map[person._id] = person);
  return map;
};

// Given an ID, find the person, whether it's their real ID or their custom ID.
methods.findByAnyId = async(personId) => {
  const Person = mongoose.model('Person');

  if (tools.isValidMongooseId(personId)) {
    const person = await Person.findById(personId);
    if (person) {
      return person;
    }
  }

  const people = await Person.find({customId: personId});

  if (people.length === 0) {
    return null;
  }

  // multiple people with the same custom ID (show an error in the UI)
  if (people.length > 1) {
    return people;
  }

  return people[0];
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

methods.sortByBirth = people => {
  people.sort((a, b) => {
    if (!a.birth || !a.birth.date || !a.birth.date.year) {
      if (!b.birth || !b.birth.date || !b.birth.date.year) {
        return 0;
      }
      return 1;
    }
    if (!b.birth || !b.birth.date || !b.birth.date.year) {
      return -1;
    }
    if (a.birth.date.year === b.birth.date.year) {
      if (a.birth.date.month === b.birth.date.month) {
        return a.birth.date.day - b.birth.date.day;
      }
      return a.birth.date.month - b.birth.date.month;
    }
    return a.birth.date.year - b.birth.date.year;
  });
}

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

methods.calculateNationality = calculateNationality;
function calculateNationality(person, people, nationality = {}, percentage = 100, safety = 0) {
  if (safety > 20) {
    return nationality;
  }

  const country = person.birthCountry;

  if (country == 'United States') {
    const parentPercentage = percentage / 2;
    for (let i = 0; i < 2; i++) {
      if (i < person.parents.length) {
        const thisPerson = person.parents[i];
        nationality = calculateNationality(thisPerson, people, nationality,
          parentPercentage, safety + 1);
      } else {
        nationality['unknown'] = nationality['unknown'] || 0;
        nationality['unknown'] += parentPercentage;
      }
    }
  } else {
    nationality[country] = nationality[country] || 0;
    nationality[country] += percentage;
  }

  return nationality;
}
