var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

// HOME

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// PEOPLE - INDEX + NEW

router.get('/allPeople', getPersonsIndexRoute(false));
router.get('/allPeople/new', getPersonsIndexRoute(true));
router.post('/allPeople/new', createNewPerson);

// EVENTS - INDEX + NEW

router.get('/allEvents', makeEventsIndexRoute(false));
router.get('/allEvents/new', makeEventsIndexRoute(true));
router.post('/allEvents/new', createNewEvent);

// SOURCES - INDEX + NEW

router.get('/sources', makeSourcesIndexRoute(false));
router.get('/sources/new', makeSourcesIndexRoute(true));
router.post('/sources/new', createNewSource);

//

module.exports = router;

function getPersonsIndexRoute(showNew) {
  return function(req, res, next) {
    mongoose.model('Person').find({}, function (err, people) {
      if (err) {
        return console.error(err);
      } else {
        res.format({
          html: function() {
            res.render('people/index', {
              people: people,
              showNew: showNew,
            });
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
          res.redirect('/allPeople');
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
      if (err) {
        return console.error(err);
      } else {
        res.format({
          html: function() {
            res.render('events/index', {
              events: events,
              showNew: showNew,
            });
          }
        });
      }
    });
  };
}

function createNewEvent(req, res) {
  var newEvent = {
    title: req.body.title,
    date: {
      year: req.body.date_year,
      month: req.body.date_month,
      day: req.body.date_day,
    },
  };

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

function makeSourcesIndexRoute(showNew) {
  return function(req, res, next) {
    mongoose.model('Source')
    .find({})
    .populate('people')
    .exec(function (err, sources) {
      if (err) {
        return console.error(err);
      } else {
        res.format({
          html: function() {
            res.render('sources/index', {
              sources: sources,
              showNew: showNew,
            });
          }
        });
      }
    });
  };
}

function createNewSource(req, res) {
  var newItem = {
    title: req.body.title.trim(),
    date: {
      year: req.body.date_year,
      month: req.body.date_month,
      day: req.body.date_day,
    },
  };

  if (newItem.title == '') {
    return;
  }

  mongoose.model('Source').create(newItem, function(err, source) {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    } else {
      res.format({
        html: function() {
          // res.redirect('/source/' + source._id);
          res.redirect('/sources');
        }
      });
    }
  });
}
