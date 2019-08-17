const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Notation = mongoose.model('Notation');
module.exports = router;

router.get('/notations', showNotations);
router.post('/notations/new', createNotation);
router.get('/notations/:id', showNotation);

function showNotations(req, res, next) {
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
    res.redirect('/notations/' + notation._id);
  });
}

function showNotation(req, res, next) {
  const notationId = req.params.id;
  Notation.findById(notationId, (err, notation) => {
    res.render('layout', {
      view: 'notations/show',
      title: 'Notation',
      notation: notation,
    });
  });
}
