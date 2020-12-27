const {
  Highlight,
  Notation,
  Source,
  createModelRoutes,
} = require('../import');

const constants = require('./constants');
const sourceTools = require('./tools');
const sourceProfile = require('./show');
const sourceForm = require('./forms');

module.exports = createRoutes;

function createRoutes(router) {
  router.param('id', sourceTools.convertParamSourceId1);
  router.param('sourceId', sourceTools.convertParamSourceId2);

  router.use(sourceTools.createRenderSource);

  createModelRoutes({
    Model: Source,
    modelName: 'source',
    router,
    index: getSourcesIndex('none'),
    create: createSource,
    delete: deleteSource,
    show: sourceProfile.summary,
    edit: sourceProfile.edit,
    otherRoutes: {
      ...sourceProfile.other
    },
    fields: constants.fields,
  });

  constants.mainSourceTypes.forEach(sourceType => {
    router.get('/sources/' + sourceType, getSourcesIndex(sourceType));
  });

  router.post('/source/:id/createCitationNotation', createSourceCiteNotation);
  router.post('/source/:id/createHighlight', createSourceHighlight);
  router.post('/source/:id/createNotation', createSourceNotation);

  router.get('/forms/census', sourceForm.getNewSourceForm);
  router.get('/source/:id/form', sourceForm.getSourceForm);
  router.post('/source/:id/form', sourceForm.saveSourceForm);
}

function getSourcesIndex(subview) {
  return async function(req, res) {
    const sources = await sourceTools.getSourcesByType(subview);
    Source.sortByStory(sources);
    res.render('source/index', {
      title: 'Sources',
      sources,
      subview,
      mainSourceTypes: constants.mainSourceTypes,
    });
  };
}

function createSource(req, res) {
  const newSource = Source.getFormDataNew(req);

  if (!newSource) {
    return res.send('error');
  }

  Source.create(newSource, (err, source) => {
    if (err) {
      return res.send('There was a problem adding the information to the '
        + 'database.<br>' + err);
    }
    res.redirect('/source/' + source._id + '/edit');
  });
}

async function deleteSource(req, res) {
  await Source.deleteOne({_id: req.sourceId});
  res.redirect('/sources');
}

async function createSourceCiteNotation(req, res) {
  const newNotation = Notation.getFormDataNew(req);
  newNotation.source = req.sourceId;
  await Notation.create(newNotation);
  res.redirect('/source/' + req.sourceId + '/edit');
}

async function createSourceHighlight(req, res) {
  const newHighlight = await Highlight.createFromForm(req);
  if (newHighlight.error) {
    return res.send(newHighlight);
  }
  res.redirect('/source/' + req.sourceId + '/highlights');
}

async function createSourceNotation(req, res) {
  const newNotation = Notation.getFormDataNew(req);
  newNotation.source = req.sourceId;
  await Notation.create(newNotation);
  res.redirect('/source/' + req.sourceId + '/notations');
}
