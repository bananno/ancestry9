const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Event = mongoose.model('Event');
const getDateValues = require('../tools/getDateValues');
const getLocationValues = require('../tools/getLocationValues');
const removePersonFromList = require('../tools/removePersonFromList');
const reorderList = require('../tools/reorderList');
const createModelRoutes = require('../tools/createModelRoutes');
module.exports = router;

router.get('/event/:eventId', makeRouteEditGet('none'));
router.post('/event/:eventId/delete', deleteEvent);

router.get('/event/:eventId/edit/date', makeRouteEditGet('date'));
router.post('/event/:eventId/edit/date', makeRouteEditPost('date'));
router.get('/event/:eventId/edit/location', makeRouteEditGet('location'));
router.post('/event/:eventId/edit/location', makeRouteEditPost('location'));

router.post('/event/:eventId/add/people', makeRouteEditPost('people', true));
router.post('/event/:eventId/delete/people/:deleteId', makeRouteDelete('people'));
router.post('/event/:eventId/reorder/people/:orderId', makeRouteReorder('people'));

router.post('/event/:eventId/add/tags', makeRouteEditPost('tags', true));
router.post('/event/:eventId/delete/tags/:deleteId', makeRouteDelete('tags'));
router.post('/event/:eventId/reorder/tags/:orderId', makeRouteReorder('tags'));

createModelRoutes({
  Model: Event,
  modelName: 'event',
  router: router,
  editView: false,
  attributes: {
    text: ['title', 'notes'],
  },
});

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

function makeRouteEditPost(fieldName, multipleValues) {
  return (req, res, next) => {
    withEvent(req, (event, eventId) => {
      const updatedObj = {};

      if (fieldName == 'date') {
        updatedObj[fieldName] = getDateValues(req);
      } else if (fieldName == 'location') {
        updatedObj[fieldName] = getLocationValues(req);
      } else if (multipleValues) {
        const newValue = req.body[fieldName];
        updatedObj[fieldName] = event[fieldName];
        updatedObj[fieldName].push(newValue);
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
      } else {
        updatedObj[fieldName] = event[fieldName].filter((value, index) => index != deleteId);
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
