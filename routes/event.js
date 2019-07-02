const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const getDateValues = require('../tools/getDateValues');
const getLocationValues = require('../tools/getLocationValues');
const removePersonFromList = require('../tools/removePersonFromList');
const reorderList = require('../tools/reorderList');

router.get('/:eventId', makeRouteEditGet('none'));
router.post('/:eventId/delete', deleteEvent);

router.post('/:eventId/edit/title', makeRouteEditPost('title'));
router.post('/:eventId/edit/notes', makeRouteEditPost('notes'));

router.get('/:eventId/edit/date', makeRouteEditGet('date'));
router.post('/:eventId/edit/date', makeRouteEditPost('date'));
router.get('/:eventId/edit/location', makeRouteEditGet('location'));
router.post('/:eventId/edit/location', makeRouteEditPost('location'));

router.post('/:eventId/add/people', makeRouteEditPost('people'));
router.post('/:eventId/delete/people/:deleteId', makeRouteDelete('people'));
router.post('/:eventId/reorder/people/:orderId', makeRouteReorder('people'));

module.exports = router;

function withEvent(req, callback) {
  const eventId = req.params.eventId;
  mongoose.model('Event')
  .findById(eventId)
  .populate('people')
  .exec((err, event) => {
    callback(event, eventId);
  });
}

function makeRouteEditGet(fieldName) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      mongoose.model('Person').find({}, (err, people) => {
        res.render('layout', {
          view: 'events/show',
          title: 'Edit Event',
          eventId: eventId,
          event: event,
          editField: fieldName,
          people: people,
        });
      });
    });
  };
}

function makeRouteEditPost(fieldName) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      const updatedObj = {};

      if (fieldName == 'date') {
        updatedObj[fieldName] = getDateValues(req);
      } else if (fieldName == 'location') {
        updatedObj[fieldName] = getLocationValues(req);
      } else if (fieldName == 'people') {
        const personId = req.body[fieldName];
        updatedObj[fieldName] = event.people;
        updatedObj[fieldName].push(personId);
      } else {
        updatedObj[fieldName] = req.body[fieldName];
      }

      event.update(updatedObj, err => {
        res.redirect('/event/' + eventId);
      });
    });
  };
}

function makeRouteDelete(fieldName) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      const updatedObj = {};
      const deleteId = req.params.deleteId;

      if (fieldName == 'people') {
        updatedObj[fieldName] = removePersonFromList(event.people, deleteId);
      }

      event.update(updatedObj, err => {
        res.redirect('/event/' + eventId);
      });
    });
  };
}

function makeRouteReorder(fieldName) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      const updatedObj = {};
      const orderId = req.params.orderId;

      updatedObj[fieldName] = reorderList(event[fieldName], orderId, fieldName);

      event.update(updatedObj, err => {
        res.redirect('/event/' + eventId);
      });
    });
  };
}

function deleteEvent(req, res) {
  withEvent(req, (event, eventId) => {
    event.remove(err => {
      res.redirect('/events');
    });
  });
}
