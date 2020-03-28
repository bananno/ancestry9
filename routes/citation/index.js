const mongoose = require('mongoose');
const Source = mongoose.model('Source');
const Citation = mongoose.model('Citation');
const sortCitations = require('../../tools/sortCitations');

module.exports = createRoutes;

function createRoutes(router) {
  router.post('/source/:sourceId/add/citations', createCitation);
  router.post('/source/:sourceId/edit/citations/:citationId', updateCitation);
  router.post('/source/:sourceId/delete/citations/:citationId', deleteCitation);
}

function createCitation(req, res, next) {
  const sourceId = req.params.sourceId;
  const newItem = getCitationValues(req, sourceId);
  const fastCitations = !!req.body.fastCitations;

  let redirectTo = '/source/' + sourceId;
  if (fastCitations) {
    redirectTo += '/fastCitations';
  } else {
    redirectTo += '/edit';
  }

  if (newItem) {
    Citation.create(newItem, () => {
      res.redirect(redirectTo);
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
