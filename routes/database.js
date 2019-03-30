const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const sortEvents = require('../tools/sortEvents');

const allFields = ['_id', 'parents', 'spouses', 'children'];
const nonRestrictedFields = ['name', 'customId', 'links', 'profileImage'];

router.get('/sharing', showDatabaseForSharing);
router.get('/database', showDatabaseEverything);

function showDatabaseForSharing(req, res) {
  getMainDatabase(data => {

    data.events = sortEvents(data.events);

    const tempPersonRef = {};

    data.people = data.allPeople.map(thisPerson => {
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
        tempPersonRef['' + person._id] = true;
      }

      return person;
    });

    data.people = data.people.filter(person => person != null);

    data.events = data.events.map(event => {
      event.people = event.people.filter(person => {
        return tempPersonRef['' + person] !== undefined;
      });
      return event;
    });

    data.events = data.events.filter(event => event.people.length > 0);

    data.citations = data.citations.filter(citation => {
      return citation.person.sharing.level == 2 && citation.source.sharing;
    });

    data.citations = data.citations.map(citation => {
      citation.source = citation.source._id;
      citation.person = citation.person._id;
      return citation;
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
                    sources: sources,
                    events: events,
                    citations: citations,
                  });
                });
            });
        });
    });
}

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

module.exports = router;
