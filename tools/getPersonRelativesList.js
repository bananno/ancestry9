
var removePersonFromList = require('./removePersonFromList');

var relativeList;
var peoplePlaced;
var people;

function getRelativesList(allPeople, person) {
  relativeList = [];
  peoplePlaced = {};
  people = allPeople;

  addRelatives(person, null, 0, 0, 0);

  var remainingPeople = allPeople.filter(thisPerson => {
    return peoplePlaced[thisPerson._id] == null;
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

function addRelatives(person, direction, removed, generation, safety) {
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

  if (removed == 0) {
    var possibleStepParents = [];
    var possibleSiblings = [];

    person.parents.forEach(thisPerson => {
      addRelatives(thisPerson, 'parent', 0, generation + 1, safety + 1);
      possibleStepParents = possibleStepParents.concat(thisPerson.spouses);
      possibleSiblings = possibleStepParents.concat(thisPerson.children);
    });

    if (generation == 0) {
      possibleStepParents.forEach(thisPerson => {
        addRelatives(thisPerson, 'step-parent', 1, generation + 1, safety + 1);
      });
      possibleSiblings.forEach(thisPerson => {
        addRelatives(thisPerson, 'sibling', 1, generation, safety + 1);
      });
    }
  } else {
    person.parents.forEach(thisPerson => {
      addRelatives(thisPerson, 'other', 0, 100, safety + 1);
    });

    person.spouses.forEach(thisPerson => {
      addRelatives(thisPerson, 'other', 0, 100, safety + 1);
    });

    person.children.forEach(thisPerson => {
      addRelatives(thisPerson, 'other', 0, 100, safety + 1);
    });
  }
}

function getGenerationName(direction, generation) {
  if (direction != null && direction != 'parent' && direction != 'child') {
    return direction;
  }
  if (generation == 0) {
    return 'person';
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

function sortList(relativeList, endPoint) {
  var madeChange = false;

  for (var i = 0; i < endPoint - 1; i++) {
    var gen1 = relativeList[i].generation;
    var gen2 = relativeList[i + 1].generation;
    var shouldSwap;

    if (gen1 == gen2) {
      shouldSwap = relativeList[i].relationship > relativeList[i + 1].relationship;
    } else {
      shouldSwap = gen2 != null && (gen1 == null || gen1 > gen2);
    }

    if (shouldSwap) {
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
