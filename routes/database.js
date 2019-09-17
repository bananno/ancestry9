const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const router = express.Router();
const sortEvents = require('../tools/sortEvents');

const fields = {
  personEveryone: [
    '_id', 'parents', 'spouses', 'children',
  ],
  personShared: [
    'name', 'customId', 'links', 'profileImage', 'gender',
  ],
  story: [
    '_id', 'type', 'title', 'date', 'location', 'people',
    'links', 'images', 'content', 'notes', 'summary',
  ],
  source: [
    '_id', 'title', 'date', 'location', 'people',
    'links', 'images', 'content', 'notes', 'summary', 'story', 'stories'
  ],
  event: [
    '_id', 'title', 'date', 'location', 'people', 'notes'
  ],
  notation: [
    '_id', 'title', 'people', 'text', 'tags', 'source', 'stories'
  ],
};

router.get('/database', showDatabaseEverything);
router.get('/sharing', saveSharedDatabase);

function showDatabaseEverything(req, res) {
  let data = {};
  new Promise(resolve => {
    resolve();
  }).then(() => {
    return saveFullDataFile(data, 'Person', 'people');
  }).then(() => {
    return saveFullDataFile(data, 'Story', 'stories');
  }).then(() => {
    return saveFullDataFile(data, 'Source', 'sources');
  }).then(() => {
    return saveFullDataFile(data, 'Event', 'events');
  }).then(() => {
    return saveFullDataFile(data, 'Citation', 'citations');
  }).then(() => {
    return saveFullDataFile(data, 'Notation', 'notations');
  }).then(() => {
    return saveFullDataFile(data, 'To-do', 'tasks');
  }).then(() => {
    res.render('database', data);
  });
}

function saveFullDataFile(data, modelName, itemName) {
  return new Promise(resolve => {
    mongoose.model(modelName).find({}, (err, results) => resolve(results));
  }).then(results => {
    data[itemName] = results;
    const filename = 'database-backup/database-' + itemName + '.json';
    const content = stringifyData(data[itemName]);
    return new Promise(resolve => {
      fs.writeFile(filename, content, resolve);
    });
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
      saveRawSharedDataFile(resolve, 'stories', data.stories);
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
    new Promise(resolve => {
      saveRawSharedDataFile(resolve, 'notations', data.notations);
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
  getRawSharedData(raw => {
    const data = {};

    const ancestors = {};

    findAncestors(raw.people.filter(person => person.name == 'Anna Peterson')[0]);

    function findAncestors(person) {
      (person.parents || []).forEach(parentId => {
        ancestors['' + parentId] = true;
        const parent = raw.people.filter(person => person._id + '' == parentId + '')[0];
        findAncestors(parent);
      });
    }

    const tempPersonRef = {};
    const tempStoryRef = {};

    data.people = raw.people.map(personInfo => {
      if (personInfo.sharing.level == 0) {
        return null;
      }

      let person = {};

      fields.personEveryone.forEach(key => {
        person[key] = personInfo[key];
      });

      person.star = ancestors[person._id + ''] == true;

      if (personInfo.sharing.level == 1) {
        person.private = true;
        person.name = personInfo.sharing.name || 'Person';
        person.customId = personInfo._id;
        return person;
      }

      person.private = false;

      fields.personShared.forEach(key => {
        person[key] = personInfo[key];
      });

      tempPersonRef['' + person._id] = true;

      person.tags = convertTags(personInfo);

      return person;
    });

    data.people = data.people.filter(person => person != null);

    data.events = getSharedEvents(raw.events, tempPersonRef);

    raw.citations = raw.citations.filter(citation => {
      return citation.person.sharing.level == 2 && citation.source.sharing;
    });

    data.citations = raw.citations.map(citation => {
      citation.source = citation.source._id;
      citation.person = citation.person._id;
      return citation;
    });

    data.stories = raw.stories.map(storyInfo => {
      const story = {};
      fields.story.forEach(attr => story[attr] = storyInfo[attr]);
      story.tags = convertTags(storyInfo);
      story.people = story.people.filter(personId => tempPersonRef['' + personId]);
      tempStoryRef[story._id] = story;
      return story;
    });

    data.sources = raw.sources.map(sourceInfo => {
      const source = {};
      fields.source.forEach(attr => source[attr] = sourceInfo[attr]);
      source.tags = convertTags(sourceInfo);
      source.people = source.people.filter(personId => tempPersonRef['' + personId]);

      const tempStory = tempStoryRef[source.story._id];
      source.fullTitle = tempStory.title + ' - ' + source.title;

      return source;
    });

    data.places = {
      list: [],
      items: [],
    };

    data.notations = raw.notations.map(rawInfo => {
      const newObj = {};
      fields.notation.forEach(attr => newObj[attr] = rawInfo[attr]);
      newObj.people = rawInfo.people.filter(personId => tempPersonRef['' + personId]);
      newObj.tags = convertTags(rawInfo);
      return newObj;
    });

    [...data.events, ...data.sources].forEach(item => {
      if (item.location == null) {
        return;
      }
      const places = [
        item.location.country || 'other', item.location.region1 || 'other',
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

function getRawSharedData(callback) {
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
          mongoose.model('Notation')
          .find({ sharing: true })
          .exec((err, notations) => {
            mongoose.model('Story')
            .find({ sharing: true })
            .exec((err, stories) => {
              callback({
                people: people,
                stories: stories,
                sources: sources,
                events: events,
                citations: citations,
                notations: notations,
              });
            });
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
    fields.event.forEach(attr => event[attr] = eventInfo[attr]);
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
