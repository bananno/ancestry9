const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Notation = mongoose.model('Notation');
const Person = mongoose.model('Person');
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
  toggleAttributes: ['sharing'],
  singleAttributes: ['title', 'text'],
  listAttributes: ['people', 'tags'],
});

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
    res.redirect('/notation/' + notation._id + '/edit');
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
