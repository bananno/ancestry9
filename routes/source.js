const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Source = mongoose.model('Source');
const Citation = mongoose.model('Citation');
const createModelRoutes = require('../tools/createModelRoutes');
const getDateValues = require('../tools/getDateValues');
const getLocationValues = require('../tools/getLocationValues');
const removePersonFromList = require('../tools/removePersonFromList');
const reorderList = require('../tools/reorderList');
const sortPeople = require('../tools/sortPeople');
const sortCitations = require('../tools/sortCitations');
const sortSources = require('../tools/sortSources');
module.exports = router;

const mainSourceTypes = ['documents', 'index', 'graves', 'newspapers',
  'photos', 'articles', 'other'];

createModelRoutes({
  Model: Source,
  modelName: 'source',
  router: router,
  index: makeSourcesIndexRoute('none'),
  new: makeSourcesIndexRoute('new'),
  create: createSource,
  show: showSource,
  edit: makeRouteEditGet('none'),
  toggleAttributes: ['sharing'],
  singleAttributes: ['type', 'group', 'title', 'content', 'notes', 'summary',
    'date', 'location'],
  listAttributes: ['people', 'links', 'images', 'tags'],
});

makeSourcesRoutes('citations', true);

router.post('/source/:sourceId/edit/citations/:citationId', editCitation);

mainSourceTypes.forEach(sourceType => {
  router.get('/sources/' + sourceType, makeSourcesIndexRoute(sourceType));
});

router.get('/source-group/:sourceId', getSourceGroup);

function makeSourcesRoutes(fieldName, canAddDeleteReorder) {
  if (canAddDeleteReorder) {
    const showOrEditPath = '/source/:sourceId/add/' + fieldName;
    const deletePath = '/source/:sourceId/delete/' + fieldName + '/:deleteId';
    const reorderPath = '/source/:sourceId/reorder/' + fieldName + '/:orderId';
    router.get(showOrEditPath, makeRouteEditGet(fieldName));
    router.post(showOrEditPath, makeRouteEditPost(fieldName));
    router.post(deletePath, makeRouteDelete(fieldName));
    router.post(reorderPath, makeRouteReorder(fieldName));
  } else {
    const showOrEditPath = '/source/:sourceId/edit/' + fieldName;
    router.get(showOrEditPath, makeRouteEditGet(fieldName));
    router.post(showOrEditPath, makeRouteEditPost(fieldName));
  }
}

function showSource(req, res) {
  const sourceId = req.params.id;
  mongoose.model('Source')
  .findById(sourceId)
  .populate('people')
  .exec((err, source) => {
    mongoose.model('Citation')
    .find({ source: source })
    .populate('person')
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

function makeRouteEditGet(editField) {
  return (req, res, next) => {
    const sourceId = req.params.id;
    mongoose.model('Source')
    .findById(sourceId)
    .populate('people')
    .exec((err, source) => {
      mongoose.model('Person')
      .find({})
      .exec((err, people) => {
        mongoose.model('Citation')
        .find({ source: source })
        .populate('person')
        .exec((err, citations) => {
          people = sortPeople(people, 'name');

          source.people.forEach((thisPerson) => {
            people = removePersonFromList(people, thisPerson);
          });

          people = [...source.people, ...people];

          res.render('layout', {
            view: 'sources/layout',
            subview: 'edit',
            title: 'Edit Source',
            source: source,
            editField: editField,
            people: people,
            citations: sortCitations(citations, 'item', source.people),
            citationsByPerson: sortCitations(citations, 'person', source.people),
          });
        });
      });
    });
  };
}

function makeRouteEditPost(editField) {
  return (req, res) => {
    const sourceId = req.params.sourceId;
    mongoose.model('Source').findById(sourceId, (err, source) => {
      const updatedObj = {};

      if (editField == 'citations') {
        const newItem = {
          item: req.body.item.trim(),
          information: req.body.information.trim(),
          person: req.body.person,
          source: source,
        };

        if (newItem.item == '' || newItem.information == '' || newItem.person == '0') {
          return;
        }

        mongoose.model('Citation').create(newItem, () => {
          res.redirect('/source/' + sourceId + '/edit');
        });
      }
    });
  };
}

function makeRouteDelete(editField) {
  return (req, res) => {
    const sourceId = req.params.sourceId;
    mongoose.model('Source').findById(sourceId, (err, source) => {
      const updatedObj = {};
      const deleteId = req.params.deleteId;

      if (editField == 'citations') {
        const citationId = req.params.deleteId;
         mongoose.model('Citation').findById(citationId, (err, citation) => {
          citation.remove(() => { });
        });
      }

      source.update(updatedObj, err => {
        res.redirect('/source/' + sourceId + '/edit');
      });
    });
  };
}

function makeRouteReorder(editField) {
  return (req, res) => {
    const sourceId = req.params.sourceId;
    mongoose.model('Source')
    .findById(sourceId)
    .exec((err, source) => {
      const updatedObj = {};
      const orderId = req.params.orderId;
      updatedObj[editField] = reorderList(source[editField], orderId, editField);
      source.update(updatedObj, err => {
        res.redirect('/source/' + sourceId + '/edit');
      });
    });
  };
}

function editCitation(req, res, next) {
  const sourceId = req.params.sourceId;
  const citationId = req.params.citationId;
  Citation.findById(citationId, (err, citation) => {
    const updatedObj = {
      source: sourceId,
      person: req.body.person,
      item: req.body.item.trim(),
      information: req.body.information.trim(),
    };
    if (updatedObj.person && updatedObj.item && updatedObj.information) {
      citation.update(updatedObj, err => {
        res.redirect('/source/' + sourceId + '/edit');
      });
    }
  });
}

function makeSourcesIndexRoute(subView) {
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
