var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var getDateValues = require('../tools/getDateValues');
var getLocationValues = require('../tools/getLocationValues');
var getNewEventValues = require('../tools/getNewEventValues');
var sortSources = require('../tools/sortSources');
var sortEvents = require('../tools/sortEvents');

// HOME

router.get('/', (req, res, next) => {
  res.render('layout', {
    view: 'index',
    title: null,
  });
});

// PEOPLE - INDEX + NEW

router.get('/allPeople', getPersonsIndexRoute(false));
router.get('/allPeople/new', getPersonsIndexRoute(true));
router.post('/allPeople/new', createNewPerson);

// EVENTS - INDEX + NEW

router.get('/events', makeEventsIndexRoute(false));
router.get('/events/new', makeEventsIndexRoute(true));
router.post('/events/new', createNewEvent);

// SOURCES - INDEX + NEW

var mainSourceTypes = ['documents', 'index', 'graves', 'newspapers', 'photos', 'articles', 'other'];

router.get('/sources', makeSourcesIndexRoute('none'));
router.get('/sources/new', makeSourcesIndexRoute('new'));
router.post('/sources/new', createNewSource);

mainSourceTypes.forEach(sourceType => {
  router.get('/sources/' + sourceType, makeSourcesIndexRoute(sourceType));
});

router.get('/source-group/:sourceId', getSourceGroup);

// DATABASE

router.get('/sharing', shareDatabase);
router.get('/database', showDatabase);

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
  var newEvent = getNewEventValues(req);

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

function makeSourcesIndexRoute(subView) {
  return function(req, res, next) {
    mongoose.model('Source')
    .find({})
    .populate('people')
    .exec(function (err, sources) {
      if (err) {
        return console.error(err);
      } else {
        sources = filterSourcesByType(sources, subView);
        sources = sortSources(sources, 'group');
        res.format({
          html: function() {
            res.render('sources/index', {
              sources: sources,
              subView: subView,
              showNew: subView == 'new',
              mainSourceTypes: mainSourceTypes,
            });
          }
        });
      }
    });
  };
}

function filterSourcesByType(sources, type) {
  if (type == 'none' || type == 'new') {
    return sources;
  }

  if (type == 'other') {
    return sources.filter(thisSource => {
      var thisSourceType = thisSource.type.toLowerCase();
      if (thisSourceType != 'index') {
        thisSourceType += 's';
      }
      return thisSourceType == 'others' || mainSourceTypes.indexOf(thisSourceType) == -1;
    });
  }

  return sources.filter(thisSource => {
    var thisSourceType = thisSource.type.toLowerCase();
    if (thisSourceType != 'index') {
      thisSourceType += 's';
    }
    return thisSourceType == type;
  });
}

function createNewSource(req, res) {
  var newItem = {
    type: req.body.type.trim(),
    group: req.body.group.trim(),
    title: req.body.title.trim(),
  };

  newItem.date = getDateValues(req);
  newItem.location = getLocationValues(req);

  if (newItem.title == '') {
    return;
  }

  mongoose.model('Source').create(newItem, function(err, source) {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    } else {
      res.format({
        html: function() {
          res.redirect('/source/' + source._id + '/edit');
        }
      });
    }
  });
}

const allFields = ['_id', 'parents', 'spouses', 'children'];
const nonRestrictedFields = ['name', 'customId', 'links'];

function shareDatabase(req, res) {
  mongoose.model('Person').find({}, function(err, allPeople) {
    mongoose.model('Source').find({}, function(err, sources) {
      mongoose.model('Event').find({}, function(err, events) {
        mongoose.model('Citation').find({}, function(err, citations) {
          events = sortEvents(events);

          let people = allPeople.map(thisPerson => {
            if (thisPerson.sharing.level == 0) {
              return null;
            }

            let person = {};

            allFields.forEach(key => {
              person[key] = thisPerson[key];
            });

            if (thisPerson.sharing.level == 1) {
              person.private = true;
              person.name = thisPerson.sharing.name || 'Person';
              person.customId = thisPerson._id;
            } else {
              person.private = false;
              nonRestrictedFields.forEach(key => {
                person[key] = thisPerson[key];
              });
            }

            return person;
          });

          people = people.filter(person => person != null);

          res.render('sharing', {
            people: people,
            sources: sources,
            events: events,
            citations: citations,
          });
        });
      });
    });
  });
}

function showDatabase(req, res) {
  mongoose.model('Person').find({}, function(err, people) {
    mongoose.model('Source').find({}, function(err, sources) {
      mongoose.model('Event').find({}, function(err, events) {
        mongoose.model('Citation').find({}, function(err, citations) {
          res.render('database', {
            people: people,
            sources: sources,
            events: events,
            citations: citations,
          });
        });
      });
    });
  });
}

function getSourceGroup(req, res, next) {
  var sourceId = req.params.sourceId;
  mongoose.model('Source')
  .findById(sourceId)
  .exec(function(err, rootSource) {
    mongoose.model('Source')
    .find({ group: rootSource.group })
    .populate('people')
    .exec(function(err, sources) {
      sources = sortSources(sources, 'date');
      res.format({
        html: function() {
          res.render('sources/group', {
            rootSource: rootSource,
            sources: sources,
          });
        }
      });
    });
  });
}
