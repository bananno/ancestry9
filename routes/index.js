const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const getDateValues = require('../tools/getDateValues');
const getLocationValues = require('../tools/getLocationValues');
const getNewEventValues = require('../tools/getNewEventValues');
const sortEvents = require('../tools/sortEvents');

// HOME

router.get('/', (req, res, next) => {
  res.render('layout', {
    view: 'index',
    title: null,
  });
});

router.get('/shared', (req, res, next) => {
  res.render('../shared/index.html');
});

// EVENTS - INDEX + NEW

router.get('/events', makeEventsIndexRoute(false));
router.get('/events/new', makeEventsIndexRoute(true));
router.post('/events/new', createNewEvent);

//

module.exports = router;

function makeEventsIndexRoute(showNew) {
  return function(req, res, next) {
    mongoose.model('Event')
    .find({})
    .populate('people')
    .exec(function (err, events) {
      events = sortEvents(events);
      if (err) {
        return console.error(err);
      } else {
        res.render('layout', {
          view: 'events/index',
          title: 'All Events',
          events: events,
          showNew: showNew,
        });
      }
    });
  };
}

function createNewEvent(req, res) {
  const newEvent = getNewEventValues(req);

  if (newEvent == null) {
    return;
  }

  mongoose.model('Event').create(newEvent, function(err, event) {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    } else {
      res.format({
        html: function() {
          res.redirect('/event/' + event._id);
        }
      });
    }
  });
}
