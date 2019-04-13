const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const personTools = require('./tools');
const sortEvents = require('../../tools/sortEvents');

convertParamPersonId();

router.get('/:personId/timeline', personTimeline);

module.exports = router;

function personTimeline(req, res, next) {
  mongoose.model('Person')
  .findById(req.personId)
  .exec(function(err, person) {
    mongoose.model('Event')
    .find({ })
    .populate('people')
    .exec(function(err, events) {
      mongoose.model('Source')
      .find({ people: person })
      .populate('people')
      .exec(function(err, sources) {
        var sourceEvents = getSourceEvents(sources);
        events = sortEvents(events);
        events = filterEvents(events, person);
        events = events.concat(sourceEvents);
        events = sortEvents(events);
        res.render('layout', {
          view: 'person/layout',
          subview: 'timeline',
          title: person.name,
          paramPersonId: req.paramPersonId,
          personId: req.personId,
          person: person,
          events: events,
        });
      });
    });
  });
}

function getSourceEvents(sources) {
  var events = [];

  sources.forEach(source => {
    var event = {
      title: source.group,
      date: { ...source.date },
      location: { ...source.location },
      people: [ ...source.people ],
      source: source,
    };

    if (source.type == 'newspaper') {
      event.type = source.type;
    } else if (source.type == 'document' && source.group.match('Census')) {
      event.type = 'census';
    } else {
      event.type = 'source';
    }

    events.push(event);
  });

  return events;
}

function filterEvents(events, person) {
  var children = person.children;
  var spouses = person.spouses;
  var birthYear = null;
  var deathYear = null;

  events = events.map((thisEvent) => {
    thisEvent.type = null;

    if (thisEvent.title.match('global -')) {
      if (!birthYear || !deathYear || !thisEvent.date
          || thisEvent.date.year < birthYear || thisEvent.date.year > deathYear) {
        return thisEvent;
      }

      thisEvent.type = 'global';
      return thisEvent;
    }

    for (var i = 0; i < thisEvent.people.length; i++) {
      if (personTools.isSamePerson(thisEvent.people[i], person)) {
        thisEvent.type = 'personal';
        if (thisEvent.title == 'birth' || thisEvent.title == 'birth and death') {
          birthYear = thisEvent.date ? thisEvent.date.year : null;
        }
        if (thisEvent.title == 'death' || thisEvent.title == 'birth and death') {
          deathYear = thisEvent.date ? thisEvent.date.year : null;
        }
        return thisEvent;
      }
    }

    for (var i = 0; i < thisEvent.people.length; i++) {
      for (var j = 0; j < spouses.length; j++) {
        if (personTools.isSamePerson(thisEvent.people[i], spouses[j])) {
          thisEvent.type = 'spouse';
          return thisEvent;
        }
      }
    }

    if (birthYear && thisEvent.date && thisEvent.date.year < birthYear) {
      return thisEvent;
    }

    if (deathYear && thisEvent.date && thisEvent.date.year > deathYear) {
      return thisEvent;
    }

    for (var i = 0; i < thisEvent.people.length; i++) {
      for (var j = 0; j < children.length; j++) {
        if (personTools.isSamePerson(thisEvent.people[i], children[j])) {
          thisEvent.type = 'child';
          return thisEvent;
        }
      }
    }

    return thisEvent;
  });

  events = events.filter((thisEvent) => {
    return thisEvent.type != null;
  });

  return events;
}

function convertParamPersonId() {
  router.param('personId', function(req, res, next, paramPersonId) {
    req.paramPersonId = paramPersonId;
    mongoose.model('Person').findById(paramPersonId, function (err, person) {
      if (err || person == null) {
        mongoose.model('Person').find({}, function (err, people) {
          var personWithId = people.filter(function(thisPerson) {
            return thisPerson.customId == paramPersonId
              || ('' + thisPerson._id) == ('' + paramPersonId);
          });
          if (personWithId.length == 0) {
            console.log('Person with ID "' + paramPersonId + '" was not found.');
            res.status(404);
            res.render('layout', {
              view: 'people/notFound',
              title: 'Not Found',
              personId: paramPersonId,
            });
          } else if (personWithId.length > 1) {
            console.log('Found more than one person with ID "' + paramPersonId + '".');
            res.render('layout', {
              view: 'people/duplicateIDs',
              title: paramPersonId,
              personId: paramPersonId,
              people: personWithId,
            });
          } else {
            req.personId = personWithId[0]._id;
            req.person = personWithId[0];
            next();
          }
        });
      } else {
        req.personId = paramPersonId;
        req.person = person;
        next();
      }
    });
  });
}
