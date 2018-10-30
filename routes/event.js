var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var getDateValues = require('../tools/getDateValues');
var getLocationValues = require('../tools/getLocationValues');
var removePersonFromList = require('../tools/removePersonFromList');

router.get('/:eventId', makeEventShowRoute('none'));
router.post('/:eventId/delete', deleteEvent);
router.get('/:eventId/editTitle', makeEventShowRoute('title'));
router.post('/:eventId/editTitle', makeEventPostRoute('title'));
router.get('/:eventId/editDate', makeEventShowRoute('date'));
router.post('/:eventId/editDate', makeEventPostRoute('date'));
router.get('/:eventId/addPerson', makeEventShowRoute('people'));
router.post('/:eventId/addPerson', makeEventPostRoute('people'));
router.post('/:eventId/deletePerson/:deleteId', makeEventDeleteRoute('people'));
router.get('/:eventId/editLocation', makeEventShowRoute('location'));
router.post('/:eventId/editLocation', makeEventPostRoute('location'));
router.get('/:eventId/edit/notes', makeEventShowRoute('notes'));
router.post('/:eventId/edit/notes', makeEventPostRoute('notes'));

module.exports = router;

function makeEventShowRoute(editField) {
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

function makeEventPostRoute(editField) {
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

function makeEventDeleteRoute(editField) {
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
