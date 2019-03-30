const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const sortEvents = require('../tools/sortEvents');

const allFields = ['_id', 'parents', 'spouses', 'children'];
const nonRestrictedFields = ['name', 'customId', 'links', 'profileImage'];

router.get('/sharing', showDatabaseForSharing);
router.get('/database', showDatabaseEverything);

function showDatabaseForSharing(req, res) {
  mongoose.model('Person').find({}, (err, allPeople) => {
    mongoose.model('Source').find({ sharing: true }, (err, sources) => {
      mongoose.model('Event').find({}, (err, events) => {
        mongoose.model('Citation').find({}).populate('person').populate('source').exec((err, citations) => {

          events = sortEvents(events);

          const tempPersonRef = {};

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
              tempPersonRef['' + person._id] = true;
            }

            return person;
          });

          people = people.filter(person => person != null);

          events = events.map(event => {
            event.people = event.people.filter(person => {
              return tempPersonRef['' + person] !== undefined;
            });
            return event;
          });

          events = events.filter(event => event.people.length > 0);

          citations = citations.filter(citation => {
            return citation.person.sharing.level == 2 && citation.source.sharing;
          });

          citations = citations.map(citation => {
            citation.source = citation.source._id;
            citation.person = citation.person._id;
            return citation;
          });

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
