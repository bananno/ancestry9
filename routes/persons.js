var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

convertParamPersonId();

router.get('/', getPersonsIndexRoute(false));
router.get('/new', getPersonsIndexRoute(true));
router.post('/new', createNewPerson);
router.get('/:personId', getPersonShowRoute('none'));

createPersonRoutes('Name', 'name', 'edit');
createPersonRoutes('Id', 'customId', 'edit');
createPersonRoutes('Link', 'links', 'add', true);

module.exports = router;

function createPersonRoutes(urlName, fieldName, actionName, canDelete) {
  var showOrEditRoute = '/:personId/' + actionName + urlName;
  var deleteRoute = '/:personId/delete' + urlName + '/:deleteId';

  router.get(showOrEditRoute, getPersonShowRoute(fieldName));
  router.post(showOrEditRoute, getPersonEditRoute(fieldName));

  if (canDelete) {
    router.post(deleteRoute, getPersonDeleteRoute(fieldName));
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

function getPersonsIndexRoute(showNew) {
  return function(req, res, next) {
    mongoose.model('Person').find({}, function (err, persons) {
      if (err) {
        return console.error(err);
      } else {
        res.format({
          html: function() {
            res.render('persons/index', {
              persons: persons,
              showNew: showNew,
            });
          }
        });
      }
    });
  };
}

function getPersonShowRoute(editView) {
  return function(req, res, next) {
    mongoose.model('Person').find({}, function(err, persons) {
      res.format({
        html: function() {
          res.render('persons/show', {
            personId: req.personId,
            person: req.person,
            persons: persons,
            editView: editView,
          });
        }
      });
    });
  };
}

function getPersonEditRoute(editField) {
  return function(req, res) {
    var person = req.person;
    var inputValue = req.body[editField];
    var updatedObj = {};
    var newValue = req.body[editField];

    if (editField == 'links') {
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

function createNewPerson(req, res, next) {
  var newPerson = {
    name: req.body.name,
    customId: req.body.name,
  };

  if (newPerson.name.trim() == '') {
    return;
  }

  while (newPerson.customId.match(' ')) {
    newPerson.customId = newPerson.customId.replace(' ', '');
  }

  mongoose.model('Person').create(newPerson, function(err, person) {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    } else {
      res.format({
        html: function() {
          res.redirect('/persons');
        }
      });
    }
  });
}

function getPersonDeleteRoute(editField) {
  return function(req, res, next) {
    var person = req.person;
    var updatedObj = {};
    var deleteId = req.params.deleteId;

    if (editField == 'links') {
      var linkIndex = deleteId;
      updatedObj[editField] = person[editField].filter((url, i) => {
        return i != linkIndex;
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
