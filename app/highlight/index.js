const {
  Highlight,
  createModelRoutes,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.post('/highlight/:id/delete', deleteHighlight);
}

async function deleteHighlight(req, res) {
  const highlightId = req.params.id;
  const highlight = await Highlight.findById(highlightId);
  const sourceId = highlight.source;
  await Highlight.deleteOne({_id: highlightId});
  res.redirect('/source/' + sourceId + '/mentions');
}
