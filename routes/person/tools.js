
function isSamePerson(person1, person2) {
  const id1 = '' + (person1._id || person1);
  const id2 = '' + (person2._id || person2);
  return id1 == id2;
}

function findPersonInList(people, person) {
  return people.filter((thisPerson) => {
    return isSamePerson(thisPerson, person);
  })[0];
}

function populateParents(person, people, safety) {
  safety = safety || 0;

  if (safety > 30) {
    return person;
  }

  person = findPersonInList(people, person);

  person.parents = person.parents.map((thisPerson) => {
    return populateParents(thisPerson, people, safety + 1);
  });

  return person;
}

module.exports = {
  isSamePerson: isSamePerson,
  findPersonInList: findPersonInList,
  populateParents: populateParents,
};
