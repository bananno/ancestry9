const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const Source = mongoose.model('Source');
const Citation = mongoose.model('Citation');
const Person = mongoose.model('Person');

const getTools = (path) => { return require('../../tools/' + path) };
const createModelRoutes = getTools('createModelRoutes');
const getDateValues = getTools('getDateValues');
const getLocationValues = getTools('getLocationValues');
const removePersonFromList = getTools('removePersonFromList');
const sortPeople = getTools('sortPeople');
const sortCitations = getTools('sortCitations');
const sortSources = getTools('sortSources');

const mainSourceTypes = ['documents', 'index', 'graves', 'newspapers',
  'photos', 'articles', 'other'];

createModelRoutes({
  Model: Source,
  modelName: 'source',
  router: router,
  index: getSourcesIndex('none'),
  new: getSourcesIndex('new'),
  create: createSource,
  show: showSource,
  edit: editSource,
  toggleAttributes: ['sharing'],
  singleAttributes: ['type', 'group', 'title', 'content', 'notes', 'summary',
    'date', 'location', 'story'],
  listAttributes: ['people', 'links', 'images', 'tags'],
});

mainSourceTypes.forEach(sourceType => {
  router.get('/sources/' + sourceType, getSourcesIndex(sourceType));
});

router.get('/source-group/:sourceId', getSourceGroup);

function getSourcesIndex(subView) {
  return (req, res, next) => {
    mongoose.model('Source')
    .find({})
    .populate('people')
    .exec((err, sources) => {
      if (err) {
        return console.error(err);
      }

      sources = filterSourcesByType(sources, subView);
      sources = sortSources(sources, 'group');

      res.render('layout', {
        view: 'sources/index',
        title: subView == 'new' ? 'New Source' : 'Sources',
        sources: sources,
        subView: subView,
        showNew: subView === 'new',
        mainSourceTypes: mainSourceTypes,
      });
    });
  };
}

function createSource(req, res) {
  const newItem = {
    type: req.body.type.trim(),
    group: req.body.group.trim(),
    title: req.body.title.trim(),
  };

  newItem.date = getDateValues(req);
  newItem.location = getLocationValues(req);

  if (newItem.title == '') {
    return res.send('Title is required.');
  }

  mongoose.model('Source').create(newItem, (err, source) => {
    if (err) {
      return res.send('There was a problem adding the information to the database.');
    }
    res.redirect('/source/' + source._id + '/edit');
  });
}

function showSource(req, res) {
  const sourceId = req.params.id;
  mongoose.model('Source').findById(sourceId).populate('people')
  .exec((err, source) => {
    mongoose.model('Citation').find({ source: source }).populate('person')
    .exec((err, citations) => {
      res.render('layout', {
        view: 'sources/layout',
        subview: 'show',
        title: source.group + ' - ' + source.title,
        source: source,
        citations: sortCitations(citations, 'item', source.people),
        citationsByPerson: sortCitations(citations, 'person', source.people),
      });
    });
  });
}

function editSource(req, res, next) {
  const sourceId = req.params.id;
  Source.findById(sourceId).populate('people').exec((err, source) => {
    Person.find({ }).exec((err, people) => {
      Citation.find({ source: source }).populate('person')
      .exec((err, citations) => {
        Source.find({ type: 'story' }).exec((err, stories) => {
          people = sortPeople(people, 'name');

          source.people.forEach(thisPerson => {
            people = removePersonFromList(people, thisPerson);
          });

          people = [...source.people, ...people];

          stories.sort((a, b) => a.title < b.title ? -1 : 1)

          res.render('layout', {
            view: 'sources/layout',
            subview: 'edit',
            title: 'Edit Source',
            source: source,
            people: people,
            stories: stories,
            citations: sortCitations(citations, 'item', source.people),
            citationsByPerson: sortCitations(citations, 'person', source.people),
          });
        });
      });
    });
  });
}

function getSourceGroup(req, res, next) {
  const sourceId = req.params.sourceId;
  mongoose.model('Source')
  .findById(sourceId)
  .exec((err, rootSource) => {
    mongoose.model('Source')
    .find({ group: rootSource.group })
    .populate('people')
    .exec((err, sources) => {
      sources = sortSources(sources, 'date');
      res.render('layout', {
        view: 'sources/group',
        title: rootSource.group,
        rootSource: rootSource,
        groupMain: sources.filter(source => source.title.toLowerCase() == 'source group')[0],
        sources: sources.filter(source => source.title.toLowerCase() != 'source group'),
      });
    });
  });
}

function filterSourcesByType(sources, type) {
  if (type == 'none' || type == 'new') {
    return sources;
  }

  if (type == 'other') {
    return sources.filter(thisSource => {
      let thisSourceType = thisSource.type.toLowerCase();
      if (thisSourceType != 'index') {
        thisSourceType += 's';
      }
      return thisSourceType == 'others' || mainSourceTypes.indexOf(thisSourceType) == -1;
    });
  }

  return sources.filter(thisSource => {
    let thisSourceType = thisSource.type.toLowerCase();
    if (thisSourceType != 'index') {
      thisSourceType += 's';
    }
    return thisSourceType == type;
  });
}
