const mongoose = require('mongoose');
const sortBy = require('../tools/sorting').sortBy;

module.exports = peoplePopulateConnections;

// 1 = root person
// 2 = ancestor
// 3 = cousin
// 4 = relative by marriage

function peoplePopulateConnections(people, rootPerson) {
  mongoose.model('Person').populateRelatives(people);

  rootPerson.connection = 1;
  rootPerson.degree = 0;

  const ancestors = [rootPerson];
  getAncestors(rootPerson, 1, 0);

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

  function getAncestors(person) {
    person.parents.forEach(relative => {
      relative.connection = 2;
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
      relative.connection = 3;
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
      relative.connection = 4;
      relative.degree = person.degree + 1;
      relativesList.push(relative);
    });
  }

  // connection type ascending, then degree of separation descending
  people.sort((a, b) => {
    let swap = (a.connection || 4) - (b.connection || 4);
    return swap == 0 ? (a.degree || 100) - (b.degree || 100) : swap;
  });
}

function sortByDegree(people) {
  sortBy(people, person => person.degree);
}
