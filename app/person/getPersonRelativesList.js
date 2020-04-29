const {
  mongoose,
  sorting,
} = require('../tools/modelTools');

const relationshipNames = getRelationshipNameList();

module.exports = getRelativesList;

function getRelativesList(allPeople) {
  const Person = mongoose.model('Person');
  const person = this;

  const relativeList = [];
  let nextGroupList = [];
  const personIsPlaced = {};

  const people = allPeople;

  addPersonToGroup(person, 0, '');
  processNextGenList(0);

  const remainingPeople = allPeople.filter(thisPerson => {
    return personIsPlaced[thisPerson._id] == null;
  });

  remainingPeople.forEach(thisPerson => {
    relativeList.push({
      person: thisPerson,
      relationship: 'no connection (' + remainingPeople.length + ')',
      generation: null,
      type: 'none',
    });
  });

  sorting.sortBy(relativeList, getSortValue);

  return relativeList;

  function processNextGenList(safety) {
    if (safety > 20) {
      return;
    }

    nextGroupList.forEach(obj => {
      relativeList.push({
        person: obj.person,
        relationship: getRelationshipName(obj.track),
        generation: obj.generation,
        distance: obj.track.length,
        track: obj.track,
        type: getRelationshipType(obj.track),
      });
    });

    const tempList = nextGroupList.concat();
    nextGroupList = [];

    tempList.forEach(obj => {
      collectRelatives(obj.person, obj.generation, obj.track);
    });

    processNextGenList(safety + 1);
  }

  function collectRelatives(person, generation, track) {
    person = Person.findInList(people, person);

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
      person = Person.findInList(people, person);
    }

    // change "parent, child" to "sibling" to count 1 degree of removal instead of 2
    track = track.replace('pc', 'x');

    personIsPlaced[person._id] = true;
    nextGroupList.push({ person: person, generation: generation, track: track });
  }
}

function getRelationshipName(track) {
  const relationship = relationshipNames[track];

  if (relationship) {
    return relationship;
  }

  const siblingIndex = track.indexOf('x');

  if (siblingIndex >= 0) {
    let before = track.slice(0, siblingIndex);
    let after = track.slice(siblingIndex + 1);

    if (before.length > 0) {
      if (relationshipNames[before] == null) {
        return 'other: ' + track;
      }
      before = relationshipNames[before] + ' ';
    }
    if (after.length > 0) {
      if (relationshipNames[after] == null) {
        return 'other: ' + track;
      }
      after = '\'s ' + relationshipNames[after];
    }

    return before + 'sibling' + after;
  }

  return 'other: ' + track;
}

function getRelationshipType(track) {
  if (track.match('s')) {
    return 'marriage';
  }

  if (track.match('x')) {
    return 'blood';
  }

  if (track.match('p')) {
    if (track.match('c')) {
      return 'blood';
    }
    return 'ancestor';
  }

  if (track.match('c')) {
    return 'descendent';
  }
}

function getSortValue(relative) {
  return [
    relative.relationship.match('no connection') ? '1' : '0',
    relative.relationship.match('other') ? '1' : '0',
    sorting.padZero(relative.distance, 2),
    sorting.padZero(Math.abs(relative.generation), 2),
  ].join('-');
}

function getRelationshipNameList() {
  const obj = {
    '' : 'person',
    'p' : 'parent',
    's' : 'spouse',
    'c' : 'child',
    'x' : 'sibling',
    'pp' : 'grandparent',
    'ppp' : 'great-grandparent',
    'pppx' : 'great-grandparent\'s sibling',
    'pppp' : 'great-great-grandparent',
    'px': 'aunt/uncle',
    'ppx': 'great-aunt/uncle',
    'pxc' : 'cousin',
    'ps' : 'stepparent',
    'xs' : 'sibling-in-law',
    'cs' : 'child-in-law',
  };

  for (let i = 3; i <= 10; i++) {
    const key1 = new Array(i + 2).fill('p').join('');
    const key2 = new Array(i + 2).fill('c').join('');
    obj[key1] = '' + i + '-great-grandparent';
    obj[key2] = '' + i + '-great-grandchild';
  }

  return obj;
}
