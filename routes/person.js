var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var sortEvents = require('../tools/sortEvents');
var sortCitations = require('../tools/sortCitations');
var removePersonFromList = require('../tools/removePersonFromList');
var getNewEventValues = require('../tools/getNewEventValues');

convertParamPersonId();

router.get('/:personId', showPerson);
router.get('/:personId/edit', makeRouteEditGet('none'));

createPersonRoutes('name');
createPersonRoutes('customId');
createPersonRoutes('links', true);

createPersonRoutes('parents', true, 'children');
createPersonRoutes('spouses', true, 'spouses');
createPersonRoutes('children', true, 'parents');

createPersonRoutes('event');

module.exports = router;

function createPersonRoutes(fieldName, urlName, canDelete, corresponding) {
  var urlName = fieldName == 'customId' ? 'id' : fieldName;

  var showOrEditRoute = '/:personId/edit/' + urlName;
  var deleteRoute = '/:personId/delete/' + urlName + '/:deleteId';

  router.get(showOrEditRoute, makeRouteEditGet(fieldName));
  router.post(showOrEditRoute, makeRouteEditPost(fieldName, corresponding));

  if (canDelete) {
    router.post(deleteRoute, makeRouteDelete(fieldName, corresponding));
  }
}

function convertParamPersonId() {
  router.param('personId', function(req, res, next, paramPersonId) {
    mongoose.model('Person').findById(paramPersonId, function (err, person) {
      if (err || person == null) {
        mongoose.model('Person').find({}, function (err, people) {
          var personWithId = people.filter(function(thisPerson) {
            return thisPerson.customId == paramPersonId;
          });
          if (personWithId.length) {
            req.personId = personWithId[0]._id;
            req.person = personWithId[0];
            next();
          } else {
            console.log('Person with ID "' + paramPersonId + '" was not found.');
            res.status(404);
            res.render('people/notFound', { personId: paramPersonId });
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

function showPerson(req, res, next) {
  mongoose.model('Person').findById(req.personId)
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec(function(err, person) {
    mongoose.model('Person')
    .find({})
    .exec(function(err, allPeople) {
      mongoose.model('Event')
      .find({ people: person })
      .populate('people')
      .exec(function(err, events) {
        mongoose.model('Citation')
        .find({ person: person })
        .populate('source')
        .exec(function(err, citations) {

          var people = removePersonFromList(allPeople, person);

          var siblings = [];

          if (person.parents.length > 0) {
            siblings = people.filter(function(thisPerson) {
              for (var i = 0; i < thisPerson.parents.length; i++) {
                var thisParent1 = thisPerson.parents[i];
                for (var j = 0; j < person.parents.length; j++) {
                  var thisParent2 = person.parents[j];
                  if (thisParent1 == thisParent2.id) {
                    return true;
                  }
                }
              }
              return false;
            });
          }

          events = sortEvents(events);
          citations = sortCitations(citations, 'item');

          res.format({
            html: function() {
              res.render('people/show', {
                personId: req.personId,
                person: person,
                people: people,
                siblings: siblings,
                events: events,
                editView: 'none',
                citations: citations,
              });
            }
          });
        });
      });
    });
  });
}

function makeRouteEditGet(editView) {
  return function(req, res, next) {
    mongoose.model('Person').findById(req.personId)
    .populate('parents')
    .populate('spouses')
    .populate('children')
    .exec(function(err, person) {
      mongoose.model('Person').find({}, function(err, allPeople) {
        var people = removePersonFromList(allPeople, person);
        res.format({
          html: function() {
            res.render('people/edit', {
              personId: req.personId,
              person: person,
              people: people,
              editView: editView,
            });
          }
        });
      });
    });
  };
}

function makeRouteEditPost(editField, corresponding) {
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
    } else if (editField == 'events') {
      var newEvent = getNewEventValues(req);

      if (newEvent == null) {
        return;
      }

      newEvent.people.push(person);

      mongoose.model('Event').create(newEvent, function() {});
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
          redirectUrl = newValue;
        } else {
          redirectUrl = (person.customId || person._id);
        }

        res.format({
          html: function() {
            res.redirect('/person/' + redirectUrl + '/edit');
          }
        });
       }
    });
  };
}

function makeRouteDelete(editField, corresponding) {
  return function(req, res, next) {
    var person = req.person;
    var updatedObj = {};
    var deleteId = req.params.deleteId;

    if (corresponding) {
      var relationship = editField;

      updatedObj[relationship] = removePersonFromList(person[relationship], deleteId);

      mongoose.model('Person').findById(deleteId, function(err, relative) {
        if (err) {
        } else {
          var updatedRelative = {};

          updatedRelative[corresponding] = removePersonFromList(relative[corresponding], person.id);

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
            res.redirect('/person/' + (person.customId || person._id) + '/edit');
          }
        });
       }
    });
  };
}
