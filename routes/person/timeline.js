const mongoose = require('mongoose');
const personTools = require('./tools');
const sortEvents = require('../../tools/sortEvents');
const Event = mongoose.model('Event');
const Source = mongoose.model('Source');

module.exports = getPersonTimeline;

async function getPersonTimeline(req, res) {
  const person = req.person;

  let events = await Event.find({}).populate('people');

  const sources = await Source.find({people: person})
    .populate('people').populate('story').populate('images');

  const sourceEvents = sources.map(convertSourceToEvent);

  events = sortEvents(events);
  events = filterEvents(events, person);
  events = events.concat(sourceEvents);
  events = sortEvents(events);

  personTools.renderPersonProfile(req, res, 'timeline', {person, events});
}

function convertSourceToEvent(source) {
  const event = {
    title: source.story.title + ' - ' + source.title,
    date: { ...source.date },
    location: { ...source.location },
    people: [ ...source.people ],
    source: source,
  };

  if (source.story.type == 'newspaper') {
    event.type = source.story.type;
  } else if (source.story.type == 'document'
      && source.story.title.match('Census')) {
    event.type = 'census';
  } else {
    event.type = 'source';
  }

  return event;
}

function filterEvents(events, person) {
  const children = person.children;
  const spouses = person.spouses;
  let birthYear, deathYear;

  events = events.map(thisEvent => {
    thisEvent.type = null;

    // Historical events that have no people in the list are global events.
    // Always include them if they are during the person's life.
    if (thisEvent.tags.includes('historical') && thisEvent.people.length == 0) {
      if (!birthYear || !thisEvent.date || thisEvent.date.year < birthYear
          || (deathYear && thisEvent.date.year > deathYear)) {
        return null;
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

  return events.filter(event => event && event.type);
}
