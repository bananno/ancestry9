const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const personTools = require('./tools');
personTools.convertParamPersonId(router);
module.exports = router;

router.get('/person/:personId/checklist', personChecklist);

function personChecklist(req, res) {
  mongoose.model('Person')
  .findById(req.personId)
  .exec((err, person) => {
    mongoose.model('Event')
    .find({ people: person })
    .exec((err, events) => {
      mongoose.model('Source')
      .find({ people: person })
      .populate('story')
      .exec((err, sources) => {
        var checklistLinks = {
          Ancestry: null,
          FamilySearch: null,
          FindAGrave: null,
          Lundberg: null,
          WikiTree: null,
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
          } else if (url.match('wikitree')) {
            checklistLinks.WikiTree = url;
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
            if (thisSource.story.title == sourceName) {
              sourceChecklist[sourceName] = true;
            }
          });
        }

        if (birthYear != null && birthYear < 1900
            && deathYear != null && deathYear > 1917) {
          var sourceName = 'World War I draft';
          sourceChecklist[sourceName] = false;
          sources.forEach((thisSource) => {
            if (thisSource.story.title == sourceName) {
              sourceChecklist[sourceName] = true;
            }
          });
        }

        if (birthYear != null && birthYear < 1925
            && deathYear != null && deathYear > 1940) {
          var sourceName = 'World War II draft';
          sourceChecklist[sourceName] = false;
          sources.forEach((thisSource) => {
            if (thisSource.story.title == sourceName) {
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
          incompleteSourceList: getIncompleteSources(sources),
        });
      });
    });
  });
}

function getIncompleteSources(sourceList) {
  const list = [];

  sourceList.forEach(source => {
    const needsContent = source.content == null || source.content == '';
    const needsImage = source.images.length == 0;
    const needsSummary = (source.summary || '').length == 0;
    const isCensus = source.type == 'document' && source.story.title.match('Census');

    let text1, text2;

    if (source.type == 'newspaper') {
      text1 = 'newspaper article: ' + source.title;
    } else if (source.type == 'grave' || isCensus) {
      text1 = source.story.title;
    } else if (source.type == 'book') {
      text1 = source.story.title + ' - ' + source.title;
    } else {
      return;
    }

    const missing = [];

    if (needsContent) {
      missing.push('transcription');
    }
    if (needsImage && source.type != 'book') {
      missing.push('image');
    }
    if (needsSummary && (isCensus || source.type == 'newspaper')) {
      missing.push('summary');
    }

    if (missing.length) {
      list.push([source, text1, missing.join(', ')]);
    }
  });

  return list;
}
