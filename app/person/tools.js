const mongoose = require('mongoose');
const Person = mongoose.model('Person');

module.exports = {
  convertParamPersonId1,
  convertParamPersonId2,
  createRenderPersonProfile,
};

function convertParamPersonId1(req, res, next, paramPersonId) { // person/:id
  if (req.originalUrl.slice(0, 7) !== '/person') {
    return next();
  }
  convertParamPersonId(req, res, next, paramPersonId)
}

function convertParamPersonId2(req, res, next, paramPersonId) { // :personId
  convertParamPersonId(req, res, next, paramPersonId);
}

function convertParamPersonId(req, res, next, paramPersonId) {
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

function createRenderPersonProfile(req, res, next) {
  res.renderPersonProfile = function(subview, options = {}) {
    const person = req.person;
    res.render('personProfile/_layout', {
      subview,
      person,
      title: person.name,
      personId: req.personId,
      paramPersonId: req.paramPersonId,
      ...options
    });
  }
  next();
}

function renderPersonNotFound(res, personId) {
  console.log('Found zero people with ID:' + personId);
  res.status(404);
  res.render('person/notFound', {
    title: 'Not Found',
    personId: personId,
  });
}

function renderPersonDuplicateId(res, personId, peopleWithId) {
  console.log('Found multiple people with ID:' + personId);
  res.render('person/duplicateIDs', {
    title: personId,
    personId: personId,
    people: peopleWithId,
  });
}
