var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/', getPersonsIndexRoute(false));
router.get('/new', getPersonsIndexRoute(true));
router.post('/new', createNewPerson);
router.get('/:personId', getPersonShowRoute('none'));
router.get('/:personId/editName', getPersonShowRoute('name'));
router.post('/:personId/editName', getPersonEditRoute('name'));

module.exports = router;

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

    updatedObj[editField] = req.body[editField];

    person.update(updatedObj, function(err) {
      if (err) {
        res.send('There was a problem updating the information to the database: ' + err);
      } else {
        res.format({
          html: function() {
            res.redirect('/persons/' + req.personId);
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
