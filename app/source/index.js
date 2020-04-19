const {
  Source,
  createModelRoutes,
} = require('../import');

const constants = require('./constants');
const sourceTools = require('./tools');
const sourceProfile = require('./show');
const sourceUpdate = require('./update');
const {mainSourceTypes, sourceFields} = constants;

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
    delete: sourceUpdate.deleteSource,
    show: sourceProfile.summary,
    edit: sourceProfile.edit,
    otherRoutes: {
      ...sourceProfile.other
    },
    fields: sourceFields,
  });

  mainSourceTypes.forEach(sourceType => {
    router.get('/sources/' + sourceType, getSourcesIndex(sourceType));
  });

  router.post('/source/:id/createCitationNotation', sourceUpdate.createCiteText);
  router.post('/source/:id/createNotation', sourceUpdate.createNotation);
}

function getSourcesIndex(subview) {
  return async function(req, res) {
    const sources = await sourceTools.getSourcesByType(subview);
    Source.sortByStory(sources);
    res.render('source/index', {
      title: 'Sources',
      sources,
      subview,
      mainSourceTypes,
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
