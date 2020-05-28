const {
  Tag,
  createModelRoutes,
} = require('../import');

const constants = require('./constants');
const tagTools = require('./tools');

module.exports = createRoutes;

function createRoutes(router) {
  router.use(tagTools.createRenderTag);
  router.param('id', tagTools.convertParamTagId);

  createModelRoutes({
    Model: Tag,
    modelName: 'tag',
    modelNamePlural: 'tags',
    router,
    index: tagIndex,
    create: createTag,
    show: showTag,
    edit: editTag,
    fields: constants.fields,
  });
}

async function tagIndex(req, res) {
  const tags = await Tag.find({});

  await tagTools.getTagIndexData(tags);

  res.render('tag/index', {
    title: 'Tags',
    tagsDefined: tags.filter(tag => tag.definition),
    tagsUndefined: tags.filter(tag => !tag.definition),
    totalNumTags: tags.length,
  });
}

function createTag(req, res) {
  const newTag = Tag.getFormDataNew(req);

  if (!newTag) {
    return res.send('error');
  }

  Tag.create(newTag, (err, tag) => {
    res.redirect('/tag/' + tag._id + '/edit');
  });
}

async function showTag(req, res) {
  const data = await tagTools.getTagShowData(req.tag);
  res.renderTag('show', {data});
}

async function editTag(req, res) {
  res.renderTag('edit', {fields: constants.fields});
}
