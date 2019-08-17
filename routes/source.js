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
module.exports = router;

const stringArrayAttributes = ['links', 'images', 'tags'];

router.get('/source/:sourceId', sourceShow);
router.get('/source/:sourceId/edit', makeRouteEditGet('none'));

createModelRoutes({
  Model: Source,
  modelName: 'source',
  router: router,
  attributes: {
    people: true,
    date: true,
    location: true,
    toggle: ['sharing'],
    text: ['type', 'group', 'title', 'content', 'notes', 'summary'],
    list: ['links', 'images', 'tags'],
  },
});

makeSourcesRoutes('date');
makeSourcesRoutes('location');
makeSourcesRoutes('people', true);
makeSourcesRoutes('citations', true);

stringArrayAttributes.forEach(attr => makeSourcesRoutes(attr, true));

router.post('/source/:sourceId/edit/citations/:citationId', editCitation);

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

function sourceShow(req, res) {
  const sourceId = req.params.sourceId;
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
    const sourceId = req.params.sourceId;
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

      if (editField == 'date') {
        updatedObj[editField] = getDateValues(req);
      } else if (editField == 'location') {
        updatedObj[editField] = getLocationValues(req);
      } else if (editField == 'people') {
        const personId = req.body[editField];
        updatedObj[editField] = source.people;
        updatedObj[editField].push(personId);
      } else if (stringArrayAttributes.includes(editField)) {
        const newValue = req.body[editField].trim();
        if (newValue == '') {
          return;
        }
        updatedObj[editField] = (source[editField] || []).concat(newValue);
      } else if (editField == 'citations') {
        const newItem = {
          item: req.body.item.trim(),
          information: req.body.information.trim(),
          person: req.body.person,
          source: source,
        };

        if (newItem.item == '' || newItem.information == '' || newItem.person == '0') {
          return;
        }

        mongoose.model('Citation').create(newItem, () => { });
      } else if (editField === 'sharing') {
        updatedObj.sharing = !(source.sharing || false);
      } else {
        updatedObj[editField] = req.body[editField];
      }

      source.update(updatedObj, err => {
        res.redirect('/source/' + sourceId + '/edit');
      });
    });
  };
}

function makeRouteDelete(editField) {
  return (req, res) => {
    const sourceId = req.params.sourceId;
    mongoose.model('Source').findById(sourceId, (err, source) => {
      const updatedObj = {};
      const deleteId = req.params.deleteId;

      if (editField == 'people') {
        updatedObj[editField] = removePersonFromList(source[editField], deleteId);
      } else if (stringArrayAttributes.includes(editField)) {
        updatedObj[editField] = source[editField].filter((url, i) => {
          return i != deleteId;
        });
      } else if (editField == 'citations') {
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
