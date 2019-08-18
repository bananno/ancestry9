const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const Source = mongoose.model('Source');
const Citation = mongoose.model('Citation');

const getTools = (path) => { return require('../../tools/' + path) };
const sortPeople = getTools('sortPeople');
const sortCitations = getTools('sortCitations');

makeSourcesRoutes('citations', true);

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

function makeRouteEditPost() {
  return () => {};
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
