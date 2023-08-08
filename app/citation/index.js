const {
  Citation,
  Source,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.param('citationId', convertParamCitationId);
  router.post('/source/:sourceId/add/citations', createCitation);
  router.post('/source/:sourceId/edit/citations/:citationId', updateCitation);
  router.post('/source/:sourceId/delete/citations/:citationId', deleteCitation);
}

async function createCitation(req, res) {
  const newCitation = Citation.getFormData(req);
  const citation = await Citation.create(newCitation);
  const baseUrl = `/source/${req.sourceId}`;

  if (req.body.fastCitations) {
    res.redirect(`${baseUrl}/fastCitations`);
  } else if (req.body.highlightCitation) {
    res.redirect(`${baseUrl}/highlightCitations#anchor-${citation.person}`);
  } else {
    res.redirect(`${baseUrl}/edit`);
  }
}

async function updateCitation(req, res) {
  const updatedItem = Citation.getFormData(req);
  if (!updatedItem) {
    // Data is invalid; page spins. Has actually proven to be convenient.
    return;
  }
  await Citation.findOneAndUpdate({_id: req.citation._id}, updatedItem);
  res.redirect('/source/' + req.sourceId + '/edit');
}

async function deleteCitation(req, res) {
  await Citation.deleteOne({_id: req.citation._id});
  res.redirect('/source/' + req.sourceId + '/edit');
}

async function convertParamCitationId(req, res, next, citationId) {
  req.citationId = citationId;
  req.citation = await Citation.findById(citationId);
  next();
}
