const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const personTools = require('./tools');
const sortEvents = require('../../tools/sortEvents');

personTools.convertParamPersonId(router);

router.get('/:personId/timeline', personTimeline);

module.exports = router;

function personTimeline(req, res, next) {
  const person = req.person;

  mongoose.model('Event')
  .find({ })
  .populate('people')
  .exec((err, events) => {
    mongoose.model('Source')
    .find({ people: person })
    .populate('people')
    .exec((err, sources) => {
      const sourceEvents = getSourceEvents(sources);
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
}

function getSourceEvents(sources) {
  const events = [];

  sources.forEach(source => {
    const event = {
      title: source.group + ' - ' + source.title,
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
  const children = person.children;
  const spouses = person.spouses;
  let birthYear, deathYear;

  events = events.map((thisEvent) => {
    thisEvent.type = null;

    if (thisEvent.title.match('historical -') && thisEvent.people.length == 0) {
      if (!birthYear || !deathYear || !thisEvent.date
          || thisEvent.date.year < birthYear || thisEvent.date.year > deathYear) {
        return thisEvent;
      }

      thisEvent.type = 'historical';
      return thisEvent;
    }

    for (let i = 0; i < thisEvent.people.length; i++) {
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

    for (let i = 0; i < thisEvent.people.length; i++) {
      for (let j = 0; j < spouses.length; j++) {
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

    for (let i = 0; i < thisEvent.people.length; i++) {
      for (let j = 0; j < children.length; j++) {
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
