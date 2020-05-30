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
    delete: deleteTag,
    show: showTag,
    edit: editTag,
    fields: constants.fields,
  });
}

async function tagIndex(req, res) {
  const tags = await Tag.find({});
  Tag.sortByTitle(tags);

  await tagTools.getTagIndexData(tags);

  const categoryTags = {};
  const noCategory = [];

  tags.forEach(tag => {
    if (tag.category) {
      tag.category
        .split(',')
        .map(str => str.trim())
        .forEach(category => {
          categoryTags[category] = categoryTags[category] || [];
          categoryTags[category].push(tag);
        });
    } else {
      noCategory.push(tag);
    }
  });

  const categoryList = [...Object.keys(categoryTags).sort(), 'none'];
  categoryTags.none = noCategory;

  res.render('tag/index', {
    title: 'Tags',
    tagsDefined: tags.filter(tag => tag.definition),
    tagsUndefined: tags.filter(tag => !tag.definition),
    totalNumTags: tags.length,
    tags,
    categoryTags,
    categoryList,
    modelsThatHaveTags: constants.modelsThatHaveTags,
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
  res.renderTag('show', {
    data,
    modelsThatHaveTags: constants.modelsThatHaveTags,
  });
}

async function editTag(req, res) {
  const editParams = {
    item: req.tag,
    itemName: 'tag',
    fields: constants.fields,
    canDelete: await req.tag.canBeDeleted(),
    tags: await Tag.getAvailableForItem(req.tag),
  };

  res.renderTag('edit', {editParams});
}

async function deleteTag(req, res) {
  await Tag.deleteOne({_id: req.tagId});
  res.redirect('/tags');
}
