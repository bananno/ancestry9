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

// PEOPLE - INDEX + NEW

router.get('/people', getPersonsIndexRoute(false));
router.get('/people/new', getPersonsIndexRoute(true));
router.post('/people/new', createNewPerson);

// EVENTS - INDEX + NEW

router.get('/events', makeEventsIndexRoute(false));
router.get('/events/new', makeEventsIndexRoute(true));
router.post('/events/new', createNewEvent);

//

module.exports = router;

function getPersonsIndexRoute(showNew) {
  return function(req, res, next) {
    mongoose.model('Person').find({}, (error, people) => {
      if (error) {
        return console.error(error);
      }
      res.render('layout', {
        view: 'people/index',
        title: 'All People',
        people: people,
        showNew: showNew,
      });
    });
  };
}

function createNewPerson(req, res, next) {
  const newPerson = {
    name: req.body.name,
    customId: req.body.name,
    gender: req.body.gender,
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
          res.redirect('/person/' + person.customId + '/edit');
        }
      });
    }
  });
}

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
