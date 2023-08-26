const {pick} = require('lodash');
const {
  Person,
  sortBy,
} = require('../import');

module.exports = getPersonVitalsChecklistData;

const connectionTitle = [null, 'start', 'ancestor', 'cousin', 'marriage'];

async function getPersonVitalsChecklistData() {
  const rawPeople = await Person.find().populate('tags');
  await Person.populateBirthAndDeath(rawPeople);

  const people = rawPeople.map(personToVitalsChecklistObj);

  // For every person, determine and append the connection type
  // (ancestor/cousin/marriage) and degree of relationship to the root
  // person. Sort the people by this relationship.
  populateRelatives(people);
  populateConnections(people);

  let countBirthMissing = 0, countDeathMissing = 0;
  people.forEach(person => {
    if (!person.birthComplete) {
      countBirthMissing += 1;
    }
    if (!person.deathComplete && !person.living) {
      countDeathMissing += 1;
    }
    person.connectionTitle = connectionTitle[person.connection];
  });

  return {
    people: people.map(person => pick(person, [
      'id', 'living', 'name', 'shareLevel',
      'birthComplete', 'deathComplete',
      'showChildrenDone', 'showChildrenNotDone', 'childrenNote',
      'connectionTitle', 'degree',
    ])),
    countBirthMissing,
    countDeathMissing,
  };
}

/////////////////////

const CONNECTION_TYPE = {
  ROOT_PERSON: 1,
  ANCESTOR: 2,
  COUSIN: 3,
  RELATED_BY_MARRIAGE: 4,
};

function populateConnections(people) {
  const rootPerson = people.find(person => person.isRoot);
  rootPerson.connection = CONNECTION_TYPE.ROOT_PERSON;
  rootPerson.degree = 0;

  const ancestors = [rootPerson];
  getAncestors(rootPerson);

  const cousins = [];
  ancestors.forEach(getDescendants);

  sortByDegree(ancestors);
  sortByDegree(cousins);

  let relativesList = [...ancestors, ...cousins];

  while (relativesList.length) {
    let tempList = relativesList;
    relativesList = [];
    tempList.forEach(getExtendedFamily);
    sortByDegree(relativesList);
  }

  sortByTypeThenDegree(people);

  ///////////////

  function getAncestors(person) {
    person.parents.forEach(relative => {
      relative.connection = CONNECTION_TYPE.ANCESTOR;
      relative.degree = person.degree + 1;
      ancestors.push(relative);
      getAncestors(relative);
    });
  }

  function getDescendants(person) {
    person.children.forEach(relative => {
      if (relative.connection) {
        return;
      }
      relative.connection = CONNECTION_TYPE.COUSIN;
      relative.degree = person.degree + 1;
      cousins.push(relative);
      getDescendants(relative);
    });
  }

  function getExtendedFamily(person) {
    const relatives = [
      ...person.parents,
      ...person.children,
      ...person.spouses
    ].filter(relative => !relative.connect);
    relatives.forEach(relative => {
      if (relative.connection) {
        return;
      }
      relative.connection = CONNECTION_TYPE.RELATED_BY_MARRIAGE;
      relative.degree = person.degree + 1;
      relativesList.push(relative);
    });
  }
}

function personToVitalsChecklistObj(person) {
  const data = {
    ...pick(person, ['name', 'living', 'shareLevel']),
    id: String(person._id),
    isRoot: person.isRoot(),
    parents: person.parents.map(id => String(id)),
    children: person.children.map(id => String(id)),
    spouses: person.spouses.map(id => String(id)),
    birthComplete: !!person.birth,
    deathComplete: !!person.death,
  };

  const numberOfChildrenTag = person.getTagValue('number of children');

  if (numberOfChildrenTag === undefined || numberOfChildrenTag === 'unknown') {
    data.showChildrenNotDone = true;
  } else if (numberOfChildrenTag === 'done') {
    data.showChildrenDone = true;
  } else if (numberOfChildrenTag === 'too distant') {
    data.childrenNote = '--';
  } else {
    data.childrenNote = person.children.length + '/' + numberOfChildrenTag;
  }

  return data;
}

// Populate all parents/spouses/children.
// This is NOT the same as Person.find(...).populate(...) because
// that only populates one level deep and cannot be used recursively.
function populateRelatives(people) {
  const personRef = {};
  // Note use of id instead of _id
  people.forEach(person => personRef[person.id] = person);
  people.forEach(person => {
    ['parents', 'children', 'spouses'].forEach(rel => {
      // .map() throws stack size error for some reason
      for (let i in person[rel]) {
        if (!person[rel][i].name) {
          person[rel][i] = personRef[person[rel][i]];
        }
      }
    });
  });
}

function sortByDegree(people) {
  sortBy(people, person => person.degree);
}

function sortByTypeThenDegree(people) {
  people.sort((a, b) => {
    // connection type ascending, then degree of separation descending
    const swap = (a.connection || 4) - (b.connection || 4);
    return swap === 0 ? (a.degree || 100) - (b.degree || 100) : swap;
  });
}
