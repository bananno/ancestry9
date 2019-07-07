const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const sortEvents = require('../tools/sortEvents');

const allFields = ['_id', 'parents', 'spouses', 'children'];
const nonRestrictedFields = ['name', 'customId', 'links', 'profileImage'];

const sourceFields = [
  '_id', 'type', 'group', 'title', 'date', 'location', 'people',
  'links', 'images', 'content', 'notes', 'summary',
];

const eventFields = ['_id', 'title', 'date', 'location', 'people', 'notes'];

router.get('/database', showDatabaseEverything);
router.get('/sharing', showDatabaseForSharing);

function showDatabaseEverything(req, res) {
  mongoose.model('Person').find({}, (err, people) => {
    mongoose.model('Source').find({}, (err, sources) => {
      mongoose.model('Event').find({}, (err, events) => {
        mongoose.model('Citation').find({}, (err, citations) => {
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

function showDatabaseForSharing(req, res) {
  getMainDatabase(data => {

    const ancestors = {};

    findAncestors(data.allPeople.filter(person => person.name == 'Anna Peterson')[0]);

    function findAncestors(person) {
      (person.parents || []).forEach(parentId => {
        ancestors['' + parentId] = true;
        const parent = data.allPeople.filter(person => person._id + '' == parentId + '')[0];
        findAncestors(parent);
      });
    }

    const tempPersonRef = {};

    data.people = data.allPeople.map(personInfo => {
      if (personInfo.sharing.level == 0) {
        return null;
      }

      let person = {};

      allFields.forEach(key => {
        person[key] = personInfo[key];
      });

      if (personInfo.sharing.level == 1) {
        person.private = true;
        person.name = personInfo.sharing.name || 'Person';
        person.customId = personInfo._id;
      } else {
        person.private = false;
        nonRestrictedFields.forEach(key => {
          person[key] = personInfo[key];
        });
        tempPersonRef['' + person._id] = true;

        person.tags = convertTags(personInfo);
      }

      person.star = ancestors[person._id + ''] == true;

      return person;
    });

    data.people = data.people.filter(person => person != null);

    data.events = getSharedEvents(data.allEvents, tempPersonRef);

    data.citations = data.citations.filter(citation => {
      return citation.person.sharing.level == 2 && citation.source.sharing;
    });

    data.citations = data.citations.map(citation => {
      citation.source = citation.source._id;
      citation.person = citation.person._id;
      return citation;
    });

    data.sources = data.allSources.map(sourceInfo => {
      const source = {};
      sourceFields.forEach(attr => source[attr] = sourceInfo[attr]);
      source.tags = convertTags(sourceInfo);
      source.people = source.people.filter(personId => tempPersonRef['' + personId]);
      return source;
    });

    data.places = {
      list: [],
      items: [],
    };

    [...data.events, ...data.sources].forEach(item => {
      if (item.location == null) {
        return;
      }
      const places = [item.location.country || 'other', item.location.region1 || 'other',
        item.location.region2 || 'other', item.location.city || 'other'];

      let tempObj = data.places;

      for (let i = 0; i < 4; i++) {
        if (tempObj[places[i]] == null) {
          tempObj.list.push(places[i]);
          tempObj[places[i]] = {
            list: [],
            items: [],
          };
        }
        tempObj = tempObj[places[i]];
      }
    });

    res.render('sharing', data);
  });
}

function getMainDatabase(callback) {
  mongoose.model('Person')
    .find({})
    .exec((err, people) => {
      mongoose.model('Source')
        .find({ sharing: true })
        .exec((err, sources) => {
          mongoose.model('Event')
            .find({})
            .exec((err, events) => {
              mongoose.model('Citation')
                .find({})
                .populate('person')
                .populate('source')
                .exec((err, citations) => {
                  callback({
                    allPeople: people,
                    allSources: sources,
                    allEvents: events,
                    citations: citations,
                  });
                });
            });
        });
    });
}

function getSharedEvents(eventList, tempPersonRef) {
  eventList = eventList.map(event => {
    // historical events that have NO people in the list are global events; always include them
    if (event.people.length == 0 && event.tags.includes['historical']) {
      return event;
    }

    // Remove non-shared people from the event.
    event.people = event.people.filter(personId => {
      return tempPersonRef['' + personId] !== undefined;
    });

    // all other events are shared IF they apply to at least one non-private person
    if (event.people.length > 0) {
      return event;
    }

    return null;
  });

  eventList = eventList.filter(event => event);

  eventList = eventList.map(eventInfo => {
    const event = {};
    eventFields.forEach(attr => event[attr] = eventInfo[attr]);
    event.tags = convertTags(eventInfo);
    return event;
  });

  return sortEvents(eventList);
}

function convertTags(obj) {
  const tags = {};
  obj.tags.forEach(tag => {
    if (tag.match('=')) {
      let [key, value] = tag.split('=').map(s => s.trim());
      tags[key] = value;
    } else {
      tags[tag] = true;
    }
  });
  return tags;
}

module.exports = router;
