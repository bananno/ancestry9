var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/:eventId', makeEventShowRoute('none'));
router.get('/:eventId/editTitle', makeEventShowRoute('title'));
router.post('/:eventId/editTitle', makeEventPostRoute('title'));
router.get('/:eventId/editDate', makeEventShowRoute('date'));
router.post('/:eventId/editDate', makeEventPostRoute('date'));
router.get('/:eventId/addPerson', makeEventShowRoute('people'));
router.post('/:eventId/addPerson', makeEventPostRoute('people'));
router.get('/:eventId/editLocation', makeEventShowRoute('location'));
router.post('/:eventId/editLocation', makeEventPostRoute('location'));

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
        updatedObj[editField] = {
          year: req.body.date_year,
          month: req.body.date_month,
          day: req.body.date_day,
        };
      } else if (editField == 'location') {
        updatedObj[editField] = {
          country: req.body.location_country,
        };
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
