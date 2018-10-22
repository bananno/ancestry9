var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/:eventId', makeEventShowRoute('none'));
router.get('/:eventId/editTitle', makeEventShowRoute('title'));
router.post('/:eventId/editTitle', makeEventPostRoute('title'));

module.exports = router;

function makeEventShowRoute(editField) {
  return function(req, res, next) {
    var eventId = req.params.eventId;
    mongoose.model('Event').findById(eventId)
    .populate('people')
    .exec(function(err, event) {
      res.format({
        html: function() {
          res.render('events/show', {
            eventId: req.eventId,
            event: event,
            editField: editField,
          });
        }
      });
    });
  };
}

function makeEventPostRoute(editField) {
  return function(req, res) {
    var eventId = req.params.eventId;
    var updatedObj = {};
    var newValue = req.body[editField];
    mongoose.model('Event').findById(eventId, function(err, event) {
      updatedObj[editField] = newValue;
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
