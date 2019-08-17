const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Notation = mongoose.model('Notation');
const Person = mongoose.model('Person');
const removePersonFromList = require('../tools/removePersonFromList');
const createModelRoutes = require('../tools/createModelRoutes');
module.exports = router;

router.get('/notations', notationsIndex);
router.post('/notations/new', createNotation);
router.get('/notation/:notationId', showNotation);
router.get('/notation/:notationId/edit', editNotation);

createModelRoutes({
  Model: Notation,
  modelName: 'notation',
  router: router,
  attributes: {
    people: true,
    toggle: ['sharing'],
    text: ['title', 'text'],
    list: ['tags'],
  },
});

makeNotationsRoutes('people', true);
makeNotationsRoutes('tags', true);

function notationsIndex(req, res, next) {
  Notation.find({}, (err, notations) => {
    res.render('layout', {
      view: 'notations/index',
      title: 'Notations',
      notations: notations,
    });
  });
}

function createNotation(req, res, next) {
  const newNotation = {
    title: req.body.title.trim(),
  };
  Notation.create(newNotation, (err, notation) => {
    if (err) {
      return res.send('There was a problem adding the information to the database.');
    }
    res.redirect('/notation/' + notation._id);
  });
}

function showNotation(req, res, next) {
  const notationId = req.params.notationId;
  Notation.findById(notationId, (err, notation) => {
    res.render('layout', {
      view: 'notations/show',
      title: 'Notation',
      notation: notation,
    });
  });
}

function editNotation(req, res, next) {
  const notationId = req.params.notationId;
  Notation.findById(notationId, (err, notation) => {
    Person.find({}, (err, people) => {
      res.render('layout', {
        view: 'notations/edit',
        title: 'Notation',
        notation: notation,
        people: people,
      });
    });
  });
}

function makeNotationsRoutes(fieldName, canAddDeleteReorder) {
  if (canAddDeleteReorder) {
    const showOrEditPath = '/notation/:notationId/add/' + fieldName;
    const deletePath = '/notation/:notationId/delete/' + fieldName + '/:deleteId';
    const reorderPath = '/notation/:notationId/reorder/' + fieldName + '/:orderId';
    router.post(showOrEditPath, makeRouteEditPost(fieldName));
    router.post(deletePath, makeRouteDelete(fieldName));
    router.post(reorderPath, makeRouteReorder(fieldName));
  } else {
    const showOrEditPath = '/notation/:notationId/edit/' + fieldName;
    router.post(showOrEditPath, makeRouteEditPost(fieldName));
  }
}

function makeRouteEditPost(editField) {
  return (req, res) => {
    const notationId = req.params.notationId;
    Notation.findById(notationId, (err, notation) => {
      const updatedObj = {};

      if (editField == 'people') {
        const personId = req.body[editField];
        updatedObj[editField] = notation.people;
        updatedObj[editField].push(personId);
      } else if (editField == 'tags') {
        const newValue = req.body[editField].trim();
        if (newValue == '') {
          return;
        }
        updatedObj[editField] = (notation[editField] || []).concat(newValue);
      } else if (editField === 'sharing') {
        updatedObj.sharing = !(notation.sharing || false);
      } else {
        updatedObj[editField] = req.body[editField];
      }

      notation.update(updatedObj, err => {
        res.redirect('/notation/' + notationId + '/edit');
      });
    });
  };
}

function makeRouteDelete(editField) {
  return (req, res) => {
    const notationId = req.params.notationId;
    Notation.findById(notationId, (err, notation) => {
      const updatedObj = {};
      const deleteId = req.params.deleteId;

      if (editField == 'people') {
        updatedObj[editField] = removePersonFromList(notation[editField], deleteId);
      } else if (stringArrayAttributes.includes(editField)) {
        updatedObj[editField] = notation[editField].filter((url, i) => {
          return i != deleteId;
        });
      } else if (editField == 'citations') {
        const citationId = req.params.deleteId;
         mongoose.model('Citation').findById(citationId, (err, citation) => {
          citation.remove(() => { });
        });
      }

      notation.update(updatedObj, err => {
        res.redirect('/notation/' + notationId + '/edit');
      });
    });
  };
}

function makeRouteReorder(editField) {
  return (req, res) => {
    const notationId = req.params.notationId;
    Notation.findById(notationId, (err, notation) => {
      const updatedObj = {};
      const orderId = req.params.orderId;
      updatedObj[editField] = reorderList(notation[editField], orderId, editField);
      notation.update(updatedObj, err => {
        res.redirect('/notation/' + notationId + '/edit');
      });
    });
  };
}
