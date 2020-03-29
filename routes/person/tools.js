const mongoose = require('mongoose');
const Person = mongoose.model('Person');

module.exports = {
  isSamePerson,
  findPersonInList,
  populateParents,
  convertParamPersonId,
  renderPersonProfile,
};

function isSamePerson(person1, person2) {
  const id1 = '' + (person1 ? (person1._id || person1) : 'null');
  const id2 = '' + (person2 ? (person2._id || person2) : 'null');
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

function convertParamPersonId(req, res, next, paramPersonId) {
  if (req.originalUrl.slice(0, 7) !== '/person') {
    return next();
  }

  req.paramPersonId = paramPersonId;

  Person.findById(paramPersonId, (err, person) => {
    if (!err && person) {
      req.personId = person._id;
      req.person = person;
      return next();
    }

    Person.find({customId: paramPersonId}, (err, people) => {
      if (err || people.length === 0) {
        return renderPersonNotFound(res, paramPersonId);
      }

      if (people.length > 1) {
        return renderPersonDuplicateId(res, paramPersonId, people);
      }

      req.personId = people[0]._id;
      req.person = people[0];
      next();
    });
  });
}

function renderPersonProfile(req, res, subview, options) {
  res.render('person/_layout', {
    subview,
    title: options.person.name,
    personId: req.personId,
    paramPersonId: req.paramPersonId,
    ...options
  });
}

function renderPersonNotFound(res, personId) {
  console.log('Found zero people with ID:' + personId);
  res.status(404);
  res.render('people/notFound', {
    title: 'Not Found',
    personId: personId,
  });
}

function renderPersonDuplicateId(res, personId, peopleWithId) {
  console.log('Found multiple people with ID:' + personId);
  res.render('people/duplicateIDs', {
    title: personId,
    personId: personId,
    people: peopleWithId,
  });
}
