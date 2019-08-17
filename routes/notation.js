const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Notation = mongoose.model('Notation');
const Person = mongoose.model('Person');
const removePersonFromList = require('../tools/removePersonFromList');
const createModelRoutes = require('../tools/createModelRoutes');
module.exports = router;

createModelRoutes({
  Model: Notation,
  modelName: 'notation',
  router: router,
  index: notationsIndex,
  create: createNotation,
  show: showNotation,
  edit: editNotation,
  updateAttributes: {
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
  const notationId = req.params.id;
  Notation.findById(notationId).populate('people').exec((err, notation) => {
    res.render('layout', {
      view: 'notations/show',
      title: 'Notation',
      notation: notation,
    });
  });
}

function editNotation(req, res, next) {
  const notationId = req.params.id;
  Notation.findById(notationId).populate('people').exec((err, notation) => {
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
  const deletePath = '/notation/:notationId/delete/' + fieldName + '/:deleteId';
  const reorderPath = '/notation/:notationId/reorder/' + fieldName + '/:orderId';
  router.post(deletePath, makeRouteDelete(fieldName));
  router.post(reorderPath, makeRouteReorder(fieldName));
}

function makeRouteDelete(editField) {
  return (req, res) => {
    const notationId = req.params.notationId;
    Notation.findById(notationId, (err, notation) => {
      const updatedObj = {};
      const deleteId = req.params.deleteId;

      if (editField == 'people') {
        updatedObj[editField] = removePersonFromList(notation[editField], deleteId);
      } else if (editField == 'tags') {
        updatedObj[editField] = notation[editField].filter((url, i) => {
          return i != deleteId;
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
