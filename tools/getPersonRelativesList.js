
var removePersonFromList = require('./removePersonFromList');

var relativeList = [];
var personIsPlaced = {};
var people;
var nextGroupList = [];

var relationshipNames = getRelationshipNameList();

function getRelativesList(allPeople, person) {
  people = allPeople;

  addPersonToGroup(person, 0, '');
  processNextGenList(0);

  var remainingPeople = allPeople.filter(thisPerson => {
    return personIsPlaced[thisPerson._id] == null;
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

function processNextGenList(safety) {
  if (safety > 20) {
    return;
  }

  nextGroupList.forEach(obj => {
    var relationship = relationshipNames[obj.track];

    if (relationship == null) {
      var lastChar = obj.track.slice(obj.track.length - 1);
      var tempTrack = obj.track.slice(0, obj.track.length - 1);
      var newRel = relationshipNames[tempTrack];
      if (lastChar == 's' && newRel) {
        relationship = newRel + '\'s spouse';
      }
    }

    if (relationship == null) {
      relationship = 'other: ' + obj.track;
    }

    relativeList.push({
      person: obj.person,
      relationship: relationship,
      generation: obj.generation,
      distance: obj.track.length,
    });
  });

  var tempList = nextGroupList.concat();
  nextGroupList = [];

  tempList.forEach(obj => {
    collectRelatives(obj.person, obj.generation, obj.track);
  });

  processNextGenList(safety + 1);
}

function collectRelatives(person, generation, track) {
  person = findPersonInList(people, person);

  person.spouses.forEach(thisPerson => {
    addPersonToGroup(thisPerson, generation, track + 's');
  });

  person.parents.forEach(thisPerson => {
    addPersonToGroup(thisPerson, generation + 1, track + 'p');
  });

  person.children.forEach(thisPerson => {
    addPersonToGroup(thisPerson, generation - 1, track + 'c');
  });
}

function addPersonToGroup(person, generation, track) {
  if (person._id) {
    if (personIsPlaced[person._id]) {
      return;
    }
  } else {
    if (personIsPlaced[person]) {
      return;
    }
    person = findPersonInList(people, person);
  }

  // change "parent, child" to "sibling" to count 1 degree of removal instead of 2
  track = track.replace('pc', 'x');

  personIsPlaced[person._id] = true;
  nextGroupList.push({ person: person, generation: generation, track: track });
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
  var gen1 = Math.abs(relative1.generation);
  var gen2 = Math.abs(relative2.generation);

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
    if (gen1 == gen2) {
      return rel1 > rel2;
    }
    return gen1 > gen2;
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

function getRelationshipNameList() {
  var obj = {
    '' : 'person',
    'p' : 'parent',
    's' : 'spouse',
    'c' : 'child',
    'x' : 'sibling',
    'pp' : 'grandparent',
    'ppp' : 'great-grandparent',
    'pppp' : 'great-great-grandparent',
    'px': 'aunt/uncle',
    'ppx': 'great-aunt/uncle',
    'pxc' : 'cousin',
    'ps' : 'stepparent',
    'xs' : 'sibling-in-law',
    'cs' : 'child-in-law',
  };

  for (var i = 3; i <= 10; i++) {
    var key1 = new Array(i + 2).fill('p').join('');
    var key2 = new Array(i + 2).fill('c').join('');
    obj[key1] = '' + i + '-great-grandparent';
    obj[key2] = '' + i + '-great-grandchild';
  }

  return obj;
}

module.exports = getRelativesList;
