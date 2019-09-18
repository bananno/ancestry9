const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const personTools = require('./tools');

module.exports = function(req, res) {
  const person = req.person;

  withData(person, data => {
    const checklistData = {};

    checklistData.checklistLinks = getLinkChecklist(person.links);

    let [birthYear, deathYear] = findBirthAndDeath(data.events);

    checklistData.checklistLife = {
      'Birth date': birthYear != null,
      'Death date': deathYear != null,
    };

    checklistData.sourceChecklist = getSourceChecklist(data.sources,
      person, birthYear, deathYear);

    checklistData.incompleteSourceList = getIncompleteSources(data.sources);

    res.render('layout', {
      view: 'person/layout',
      subview: 'checklist',
      title: person.name,
      paramPersonId: req.paramPersonId,
      person: person,
      ...checklistData
    });
  });
};

function withData(person, callback) {
  mongoose.model('Event')
  .find({ people: person })
  .exec((err, events) => {
    mongoose.model('Source')
    .find({ people: person })
    .populate('story')
    .exec((err, sources) => {
      callback({
        events: events,
        sources: sources,
      });
    });
  });
}

function getLinkChecklist(links) {
  const checklistLinks = {
    Ancestry: null,
    FamilySearch: null,
    FindAGrave: null,
    Lundberg: null,
    WikiTree: null,
  };

  links.forEach(url => {
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

  return checklistLinks;
}

function findBirthAndDeath(events) {
  let birthYear, deathYear;

  events.forEach(event => {
    if (event.title == 'birth') {
      if (event.date != null && event.date.year != null) {
        birthYear = event.date.year;
      }
    } else if (event.title == 'death') {
      if (event.date != null && event.date.year != null) {
        deathYear = event.date.year;
      }
    }
  });

  return [birthYear, deathYear];
}

function getSourceChecklist(sources, person, birthYear, deathYear) {
  const sourceChecklist = {};

  const checkForStory = (attr, value) => {
    sourceChecklist[value] = sources.filter(source => {
      return source.story[attr] == value;
    }).length > 0;
  };

  checkForStory('type', 'cemetery');

  for (let year = 1840; year <= 1940; year += 10) {
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

    checkForStory('title', 'Census USA ' + year);
  }

  if (birthYear != null && deathYear != null
      && !person.tags.includes('gender=female')) {
    if (birthYear < 1900 && deathYear > 1917) {
      checkForStory('title', 'World War I draft');
    }
    if (birthYear < 1925 && deathYear > 1940) {
      checkForStory('title', 'World War II draft');
    }
  }

  return sourceChecklist;
}

function getIncompleteSources(sourceList) {
  const list = [];

  sourceList.forEach(source => {
    const needsContent = source.content == null || source.content == '';
    const needsImage = source.images.length == 0;
    const needsSummary = (source.summary || '').length == 0;
    const isCensus = source.story.type == 'document'
      && source.story.title.match('Census');

    let text1, text2;

    if (source.story.type == 'newspaper') {
      text1 = 'newspaper article: ' + source.title;
    } else if (source.story.type == 'cemetery' || isCensus) {
      text1 = source.story.title;
    } else if (source.story.type == 'book') {
      text1 = source.story.title + ' - ' + source.title;
    } else {
      return;
    }

    const missing = [];

    if (needsContent) {
      missing.push('transcription');
    }
    if (needsImage && source.story.type != 'book') {
      missing.push('image');
    }
    if (needsSummary && (isCensus || source.story.type == 'newspaper')) {
      missing.push('summary');
    }

    if (missing.length) {
      list.push([source, text1, missing.join(', ')]);
    }
  });

  return list;
}
