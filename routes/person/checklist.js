const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const personTools = require('./tools');
personTools.convertParamPersonId(router);
module.exports = router;

router.get('/:personId/checklist', personChecklist);

function personChecklist(req, res) {
  mongoose.model('Person')
  .findById(req.personId)
  .exec(function(err, person) {
    mongoose.model('Event')
    .find({ people: person })
    .exec(function(err, events) {
      mongoose.model('Source')
      .find({ people: person })
      .exec(function(err, sources) {
        var checklistLinks = {
          Ancestry: null,
          FamilySearch: null,
          FindAGrave: null,
          Lundberg: null,
        };

        person.links.forEach((url) => {
          if (url.match('lundbergancestry')) {
            checklistLinks.Lundberg = url;
          } else if (url.match('ancestry.com')) {
            checklistLinks.Ancestry = url;
          } else if (url.match('familysearch.org')) {
            checklistLinks.FamilySearch = url;
          } else if (url.match('findagrave')) {
            checklistLinks.FindAGrave = url;
          }
        });

        var checklistLife = {
          'Birth date': false,
          'Death date': false,
        };

        var birthYear = null;
        var deathYear = null;

        events.forEach((thisEvent) => {
          if (thisEvent.title == 'birth') {
            if (thisEvent.date != null && thisEvent.date.year != null) {
              checklistLife['Birth date'] = true;
              birthYear = thisEvent.date.year;
            }
          } else if (thisEvent.title == 'death') {
            if (thisEvent.date != null && thisEvent.date.year != null) {
              checklistLife['Death date'] = true;
              deathYear = thisEvent.date.year;
            }
          }
        });

        var sourceChecklist = {};

        sourceChecklist['grave'] = sources.filter((thisSource) => {
          return thisSource.type == 'grave';
        }).length > 0;

        for (var year = 1840; year <= 1940; year += 10) {
          if (birthYear != null && birthYear > year) {
            continue;
          }
          if (deathYear == null) {
            if (birthYear != null && year - birthYear > 90) {
              continue;
            }
          } else if (deathYear < year) {
            continue;
          }
          var sourceName = 'Census USA ' + year;
          sourceChecklist[sourceName] = false;
          sources.forEach((thisSource) => {
            if (thisSource.group == sourceName) {
              sourceChecklist[sourceName] = true;
            }
          });
        }

        if (birthYear != null && birthYear < 1900
            && deathYear != null && deathYear > 1917) {
          var sourceName = 'World War I draft';
          sourceChecklist[sourceName] = false;
          sources.forEach((thisSource) => {
            if (thisSource.group == sourceName) {
              sourceChecklist[sourceName] = true;
            }
          });
        }

        if (birthYear != null && birthYear < 1925
            && deathYear != null && deathYear > 1940) {
          var sourceName = 'World War II draft';
          sourceChecklist[sourceName] = false;
          sources.forEach((thisSource) => {
            if (thisSource.group == sourceName) {
              sourceChecklist[sourceName] = true;
            }
          });
        }

        res.render('layout', {
          view: 'person/layout',
          subview: 'checklist',
          title: person.name,
          paramPersonId: req.paramPersonId,
          person: person,
          checklistLinks: checklistLinks,
          checklistLife: checklistLife,
          sourceChecklist: sourceChecklist,
        });
      });
    });
  });
}