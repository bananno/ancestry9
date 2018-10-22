var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

convertParamPersonId();

router.get('/:personId', getPersonShowRoute('none'));

createPersonRoutes('Name', 'name', 'edit');
createPersonRoutes('Id', 'customId', 'edit');
createPersonRoutes('Link', 'links', 'add', true);

createPersonRoutes('Parent', 'parents', 'add', true, 'children');
createPersonRoutes('Spouse', 'spouses', 'add', true, 'spouses');
createPersonRoutes('Child', 'children', 'add', true, 'parents');

module.exports = router;

function createPersonRoutes(urlName, fieldName, actionName, canDelete, corresponding) {
  var showOrEditRoute = '/:personId/' + actionName + urlName;
  var deleteRoute = '/:personId/delete' + urlName + '/:deleteId';

  router.get(showOrEditRoute, getPersonShowRoute(fieldName));
  router.post(showOrEditRoute, getPersonEditRoute(fieldName, corresponding));

  if (canDelete) {
    router.post(deleteRoute, getPersonDeleteRoute(fieldName, corresponding));
  }
}

function convertParamPersonId() {
  router.param('personId', function(req, res, next, paramPersonId) {
    mongoose.model('Person').findById(paramPersonId, function (err, person) {
      if (err || person == null) {
        mongoose.model('Person').find({}, function (err, persons) {
          var personWithId = persons.filter(function(thisPerson) {
            return thisPerson.customId == paramPersonId;
          });
          if (personWithId.length) {
            req.personId = personWithId[0]._id;
            req.person = personWithId[0];
            next();
          } else {
            console.log('Person with ID "' + paramPersonId + '" was not found.');
            res.status(404);
            res.render('persons/notFound', { personId: paramPersonId });
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

function getPersonShowRoute(editView) {
  return function(req, res, next) {
    mongoose.model('Person').findById(req.personId)
    .populate('parents')
    .populate('spouses')
    .populate('children')
    .exec(function(err, person) {
      mongoose.model('Person').find({}, function(err, allPersons) {
        var persons = filterOutPerson(allPersons, person);
        res.format({
          html: function() {
            res.render('persons/show', {
              personId: req.personId,
              person: person,
              persons: persons,
              editView: editView,
            });
          }
        });
      });
    });
  };
}

function getPersonEditRoute(editField, corresponding) {
  return function(req, res) {
    var person = req.person;
    var updatedObj = {};
    var newValue = req.body[editField];

    if (corresponding) {
      var newPersonId = newValue;

      if (newPersonId != '0') {
        updatedObj[editField] = (person[editField] || []).concat(newPersonId);

        mongoose.model('Person').findById(newPersonId, function(err, relative) {
          var updatedRelative = {};
          updatedRelative[corresponding] = relative[corresponding] || [];
          updatedRelative[corresponding].push(person.id);
          relative.update(updatedRelative, () => {});
        });
      }
    } else if (editField == 'links') {
      if (newValue != '') {
        updatedObj[editField] = (person[editField] || []).concat(newValue);
      }
    } else {
      updatedObj[editField] = newValue;
    }

    person.update(updatedObj, function(err) {
      if (err) {
        res.send('There was a problem updating the information to the database: ' + err);
      } else {
        var redirectUrl;

        if (editField == 'customId') {
          redirectUrl = '/persons/' + newValue;
        } else {
          redirectUrl = '/persons/' + (person.customId || person._id);
        }

        res.format({
          html: function() {
            res.redirect(redirectUrl);
          }
        });
       }
    });
  };
}

function getPersonDeleteRoute(editField, corresponding) {
  return function(req, res, next) {
    var person = req.person;
    var updatedObj = {};
    var deleteId = req.params.deleteId;

    if (corresponding) {
      var relationship = editField;

      updatedObj[relationship] = filterOutPerson(person[relationship], deleteId);

      mongoose.model('Person').findById(deleteId, function(err, relative) {
        if (err) {
        } else {
          var updatedRelative = {};

          updatedRelative[corresponding] = filterOutPerson(relative[corresponding], person.id);

          relative.update(updatedRelative, () => {});
        }
      });
    } else if (editField == 'links') {
      updatedObj[editField] = person[editField].filter((url, i) => {
        return i != deleteId;
      });
    }

    person.update(updatedObj, function(err) {
      if (err) {
        res.send('There was a problem updating the information to the database: ' + err);
      } else {
        res.format({
          html: function() {
            res.redirect('/persons/' + (person.customId || person._id));
          }
        });
       }
    });
  };
}

function filterOutPerson(persons, person) {
  var removeId = person;
  if (person._id) {
    removeId = person._id;
  }
  removeId = '' + removeId;
  return persons.filter((thisPerson) => {
    return ('' + thisPerson._id) != removeId;
  });
}
