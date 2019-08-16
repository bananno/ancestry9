const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
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
router.get('/sharing', saveSharedDatabase);

function showDatabaseEverything(req, res) {
  let data = {};
  new Promise(resolve => {
    mongoose.model('Person').find({}, (err, people) => {
      data.people = people;
      resolve();
    });
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Source').find({}, (err, sources) => {
        data.sources = sources;
        resolve();
      });
    });
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Event').find({}, (err, events) => {
        data.events = events;
        resolve();
      });
    });
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Citation').find({}, (err, citations) => {
        data.citations = citations;
        resolve();
      });
    });
  }).then(() => {
    const filename = 'database-backup/database-people.json';
    const content = stringifyData(data.people);
    return new Promise(resolve => {
      fs.writeFile(filename, content, resolve);
    });
  }).then(() => {
    const filename = 'database-backup/database-sources.json';
    const content = stringifyData(data.sources);
    return new Promise(resolve => {
      fs.writeFile(filename, content, resolve);
    });
  }).then(() => {
    const filename = 'database-backup/database-events.json';
    const content = stringifyData(data.events);
    return new Promise(resolve => {
      fs.writeFile(filename, content, resolve);
    });
  }).then(() => {
    const filename = 'database-backup/database-citations.json';
    const content = stringifyData(data.citations);
    return new Promise(resolve => {
      fs.writeFile(filename, content, resolve);
    });
  }).then(() => {
    res.render('database', data);
  });
}

function stringifyData(array) {
  return '[\n' + array.map(s => JSON.stringify(s)).join(',\n') + '\n]';
}

function saveSharedDatabase(req, res) {
  let data = {};
  new Promise(resolve => {
    getProcessedSharedData(req, res, output => {
      data = output;
      resolve();
    });
  }).then(() => {
    new Promise(resolve => {
      saveRawSharedDataFile(resolve, 'people', data.people, true);
    });
  }).then(() => {
    new Promise(resolve => {
      saveRawSharedDataFile(resolve, 'sources', data.sources);
    });
  }).then(() => {
    new Promise(resolve => {
      saveRawSharedDataFile(resolve, 'events', data.events);
    });
  }).then(() => {
    new Promise(resolve => {
      saveRawSharedDataFile(resolve, 'citations', data.citations);
    });
  }).then(() => {
    res.redirect('/');
  });
}

function saveRawSharedDataFile(resolve, attr, arr, starter) {
  const filename = 'shared/database/raw-' + attr + '.js';

  const content = (
    (starter ? 'const DATABASE = {};\n\n' : '') +
    'DATABASE.' + attr + ' = [\n' +
      arr.map(item => '  ' + JSON.stringify(item) + ',').join('\n') +
    '\n];\n'
  );

  fs.writeFile(filename, content, err => {
    if (err) {
      throw err;
    }
    resolve();
  });
}

function getProcessedSharedData(req, res, callback) {
  getMainDatabase(data => {
    console.log('process shared data');

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

    callback(data);
  });
}

function getMainDatabase(callback) {
  console.log('get shared data');
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
    if (event.people.length == 0 && event.tags.includes('historical')) {
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
