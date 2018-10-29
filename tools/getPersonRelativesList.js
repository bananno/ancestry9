
var removePersonFromList = require('./removePersonFromList');

var relativeList;
var peoplePlaced;
var people;

function getRelativesList(allPeople, person) {
  relativeList = [];
  peoplePlaced = {};
  people = allPeople;

  addRelatives(person, null, 0, 0);

  return relativeList;
}

function addRelatives(person, direction, generation, safety) {
  if (safety > 20) {
    return;
  }

  if (peoplePlaced[person._id] != null) {
    return;
  }

  peoplePlaced[person._id] = true;
  person = findPersonInList(people, person);
  var relationship = getGenerationName(direction, generation);

  relativeList.push({
    person: person,
    relationship: relationship,
    generation: generation,
  });

  person.parents.forEach((nextPerson) => {
    addRelatives(nextPerson, 'parent', generation + 1, safety + 1);
  });

  person.children.forEach((nextPerson) => {
    return;
    addRelatives(nextPerson, 'child', generation + 1, safety + 1);
  });
}

function getGenerationName(direction, generation) {
  if (generation == 0) {
    return '';
  }
  if (generation == 1) {
    return 'parent';
  }
  if (generation == 2) {
    return 'grand' + direction;
  }
  if (generation == 3) {
    return 'great-grand' + direction;
  }
  if (generation == 4) {
    return 'great-great-grand' + direction;
  }
  return '' + (generation - 2) + '-great-grand' + direction;
}

function findPersonInList(people, person) {
  return people.filter((thisPerson) => {
    return isSamePerson(thisPerson, person);
  })[0];
}

function isSamePerson(person1, person2) {
  var id1 = person1._id ? person1._id : person1;
  var id2 = person2._id ? person2._id : person2;
  id1 = '' + id1;
  id2 = '' + id2;
  return id1 == id2;
}

module.exports = getRelativesList;
