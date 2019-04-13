const mongoose = require('mongoose');

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

function convertParamPersonId(router) {
  router.param('personId', (req, res, next, paramPersonId) => {
    req.paramPersonId = paramPersonId;
    mongoose.model('Person').findById(paramPersonId, (err, person) => {
      if (err || person == null) {
        mongoose.model('Person').find({}, (err, people) => {
          const personWithId = people.filter(thisPerson => {
            return thisPerson.customId == paramPersonId
              || ('' + thisPerson._id) == ('' + paramPersonId);
          });

          if (personWithId.length == 0) {
            console.log('Person with ID "' + paramPersonId + '" was not found.');
            res.status(404);
            res.render('layout', {
              view: 'people/notFound',
              title: 'Not Found',
              personId: paramPersonId,
            });
          } else if (personWithId.length > 1) {
            console.log('Found more than one person with ID "' + paramPersonId + '".');
            res.render('layout', {
              view: 'people/duplicateIDs',
              title: paramPersonId,
              personId: paramPersonId,
              people: personWithId,
            });
          } else {
            req.personId = personWithId[0]._id;
            req.person = personWithId[0];
            next();
          }
        });
      } else {
        req.personId = paramPersonId;
        req.person = person;
        next();
      }
    });
  });
}

module.exports = {
  isSamePerson: isSamePerson,
  findPersonInList: findPersonInList,
  populateParents: populateParents,
  convertParamPersonId: convertParamPersonId,
};
