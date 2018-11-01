
var removePersonFromList = require('./removePersonFromList');

var relativeList = [];
var personPlaced = {};
var personRelativesChecked = {};
var people;

var relationshipNames = {
  '' : 'person',
  'p' : 'parent',
  's' : 'spouse',
  'c' : 'child',
  'pc' : 'sibling',
  'ps' : 'stepparent',
  'pp' : 'grandparent',
  'ppp' : 'great-grandparent',
  'pppp' : 'great-great-grandparent',
  'cs' : 'child-in-law',
};

function getRelativesList(allPeople, person) {
  people = allPeople;

  addPersonToList(person, 0, '');
  addPersonRelatives(person, 0, '', 0);

  var remainingPeople = allPeople.filter(thisPerson => {
    return personPlaced[thisPerson._id] == null;
  });

  remainingPeople.forEach(thisPerson => {
    relativeList.push({
      person: thisPerson,
      relationship: 'no connection (' + remainingPeople.length + ')',
      generation: null,
    });
  });

  return sortList(relativeList, relativeList.length);
}

function addPersonToList(person, generation, track) {
  person = findPersonInList(people, person);

  if (personPlaced[person._id] != null) {
    return;
  }

  personPlaced[person._id] = true;

  relativeList.push({
    person: person,
    relationship: relationshipNames[track] || ('other: ' + track),
    generation: generation,
    distance: track.length,
  });
}

function addPersonRelatives(person, generation, track, safety) {
  if (safety > 20) {
    return;
  }

  person = findPersonInList(people, person);

  if (personRelativesChecked[person._id] != null) {
    return;
  }

  personRelativesChecked[person._id] = true;

  person.spouses.forEach(thisPerson => {
    addPersonToList(thisPerson, generation, track + 's');
  });

  person.parents.forEach(thisPerson => {
    addPersonToList(thisPerson, generation + 1, track + 'p');
  });

  person.children.forEach(thisPerson => {
    addPersonToList(thisPerson, generation - 1, track + 'c');
  });

  person.spouses.forEach(thisPerson => {
    addPersonRelatives(thisPerson, generation, track + 's', safety + 1);
  });

  person.parents.forEach(thisPerson => {
    addPersonRelatives(thisPerson, generation + 1, track + 'p', safety + 1);
  });

  person.children.forEach(thisPerson => {
    addPersonRelatives(thisPerson, generation - 1, track + 'c', safety + 1);
  });

  return person;
}

function sortList(relativeList, endPoint) {
  var madeChange = false;

  for (var i = 0; i < endPoint - 1; i++) {
    if (shouldSwap(relativeList[i], relativeList[i + 1])) {
      var temp = relativeList[i];
      relativeList[i] = relativeList[i + 1];
      relativeList[i + 1] = temp;
      madeChange = true;
    }
  }

  if (madeChange) {
    return sortList(relativeList, endPoint - 1);
  }

  return relativeList;
}

function shouldSwap(relative1, relative2) {
  var dist1 = relative1.distance;
  var dist2 = relative2.distance;
  var rel1 = relative1.relationship;
  var rel2 = relative2.relationship;

  var isOther1 = rel1.match('other') != null;
  var isOther2 = rel2.match('other') != null;

  var isNone1 = rel1.match('no connection') != null;
  var isNone2 = rel2.match('no connection') != null;

  if (isNone1) {
    if (!isNone2) {
      return true;
    }
  } else if (isNone2) {
    return false;
  }

  if (isOther1) {
    if (!isOther2) {
      return true;
    }
  } else if (isOther2) {
    return false;
  }

  if (dist1 == dist2) {
    return rel1 > rel2;
  }

  return dist1 > dist2;
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
