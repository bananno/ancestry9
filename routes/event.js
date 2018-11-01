var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var getDateValues = require('../tools/getDateValues');
var getLocationValues = require('../tools/getLocationValues');
var removePersonFromList = require('../tools/removePersonFromList');

router.get('/:eventId', makeRouteEditGet('none'));
router.post('/:eventId/delete', deleteEvent);
router.get('/:eventId/edit/title', makeRouteEditGet('title'));
router.post('/:eventId/edit/title', makeRouteEditPost('title'));
router.get('/:eventId/edit/date', makeRouteEditGet('date'));
router.post('/:eventId/edit/date', makeRouteEditPost('date'));
router.get('/:eventId/add/people', makeRouteEditGet('people'));
router.post('/:eventId/add/people', makeRouteEditPost('people'));
router.post('/:eventId/delete/people/:deleteId', makeRouteDelete('people'));
router.post('/:eventId/reorder/people/:orderId', makeRouteReorder('people'));
router.get('/:eventId/edit/location', makeRouteEditGet('location'));
router.post('/:eventId/edit/location', makeRouteEditPost('location'));
router.get('/:eventId/edit/notes', makeRouteEditGet('notes'));
router.post('/:eventId/edit/notes', makeRouteEditPost('notes'));

module.exports = router;

function makeRouteEditGet(editField) {
  return function(req, res, next) {
    var eventId = req.params.eventId;
    mongoose.model('Event').findById(eventId)
    .populate('people')
    .exec(function(err, event) {
      mongoose.model('Person').find({}, function(err, people) {
        res.format({
          html: function() {
            res.render('events/show', {
              eventId: req.eventId,
              event: event,
              editField: editField,
              people: people,
            });
          }
        });
      });
    });
  };
}

function makeRouteEditPost(editField) {
  return function(req, res) {
    var eventId = req.params.eventId;
    mongoose.model('Event').findById(eventId, function(err, event) {
      var updatedObj = {};

      if (editField == 'date') {
        updatedObj[editField] = getDateValues(req);
      } else if (editField == 'location') {
        updatedObj[editField] = getLocationValues(req);
      } else if (editField == 'people') {
        var personId = req.body[editField];
        updatedObj[editField] = event.people;
        updatedObj[editField].push(personId);
      } else {
        updatedObj[editField] = req.body[editField];
      }

      event.update(updatedObj, function(err) {
        res.format({
          html: function() {
            res.redirect('/event/' + eventId);
          }
        });
      });
    });
  };
}

function makeRouteDelete(editField) {
  return function(req, res) {
    var eventId = req.params.eventId;
    mongoose.model('Event').findById(eventId, function(err, event) {
      var updatedObj = {};
      var deleteId = req.params.deleteId;

      if (editField == 'people') {
        updatedObj[editField] = removePersonFromList(event.people, deleteId);
      }

      event.update(updatedObj, function(err) {
        res.format({
          html: function() {
            res.redirect('/event/' + eventId);
          }
        });
      });
    });
  };
}

function makeRouteReorder(attr) {
  return function(req, res) {
    var eventId = req.params.eventId;
    mongoose.model('Event').findById(eventId, function(err, event) {
      var updatedObj = {};
      updatedObj[attr] = event[attr];
      var orderId = req.params.orderId;

      if (attr == 'people') {
        for (var i = 1; i < updatedObj[attr].length; i++) {
          var thisPerson = updatedObj[attr][i];
          if (isSamePerson(thisPerson, orderId)) {
            updatedObj[attr][i] = updatedObj[attr][i - 1];
            updatedObj[attr][i - 1] = thisPerson;
            break;
          }
        }
      }

      event.update(updatedObj, function(err) {
        res.format({
          html: function() {
            res.redirect('/event/' + eventId);
          }
        });
      });
    });
  };
}

function deleteEvent(req, res) {
  var eventId = req.params.eventId;
  mongoose.model('Event').findById(eventId, function(err, event) {
    event.remove(function(err) {
      res.format({
        html: function() {
          res.redirect('/events');
        }
      });
    });
  });
}

// HELPER

function isSamePerson(person1, person2) {
  var id1 = person1._id ? person1._id : person1;
  var id2 = person2._id ? person2._id : person2;
  id1 = '' + id1;
  id2 = '' + id2;
  return id1 == id2;
}
