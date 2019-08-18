const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const Source = mongoose.model('Source');
const Citation = mongoose.model('Citation');

const sortPeople = require('../../tools/sortPeople');
const sortCitations = require('../../tools/sortCitations');

router.post('/source/:sourceId/add/citations', createCitation);
router.post('/source/:sourceId/edit/citations/:citationId', updateCitation);
router.post('/source/:sourceId/delete/citations/:citationId', deleteCitation);

function createCitation(req, res, next) {
  const sourceId = req.params.sourceId;
  const newItem = getCitationValues(req, sourceId);

  if (newItem) {
    Citation.create(newItem, () => {
      res.redirect('/source/' + sourceId + '/edit');
    });
  }
}

function updateCitation(req, res, next) {
  const sourceId = req.params.sourceId;
  const citationId = req.params.citationId;
  const updatedItem = getCitationValues(req, sourceId);

  if (updatedItem) {
    Citation.findById(citationId, (err, citation) => {
      citation.update(updatedItem, () => {
        res.redirect('/source/' + sourceId + '/edit');
      });
    });
  }
}

function deleteCitation(req, res, next) {
  const sourceId = req.params.sourceId;
  const citationId = req.params.citationId;

  Citation.findById(citationId, (err, citation) => {
    citation.delete(() => {
      res.redirect('/source/' + sourceId + '/edit');
    });
  });
}

function getCitationValues(req, sourceId) {
  const citationValues = {
    source: sourceId,
    person: req.body.person,
    item: req.body.item.trim(),
    information: req.body.information.trim(),
  };

  if (citationValues.item == '' || citationValues.information == ''
      || citationValues.person == '0') {
    return;
  }

  return citationValues;
}
