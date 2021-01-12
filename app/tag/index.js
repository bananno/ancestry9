const {
  Tag,
  createController,
  getEditTableRows,
} = require('../import');

const constants = require('./constants');
const tagTools = require('./tools');

module.exports = createRoutes;

function createRoutes(router) {
  router.use(tagTools.createRenderTag);
  router.param('id', tagTools.convertParamTagId);

  createController({
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

  router.get('/tags/:indexFormat', tagIndex);
}

async function tagIndex(req, res) {
  const indexFormat = req.params.indexFormat || constants.indexFormats[0];

  const tags = await Tag.find({});
  Tag.sortByTitle(tags);

  await tagTools.getTagIndexData(tags);

  const pageData = {
    title: 'Tags',
    indexFormat,
    totalNumTags: tags.length,
    tags,
    modelsThatHaveTags: constants.modelsThatHaveTags,
    indexFormats: constants.indexFormats,
  };

  if (indexFormat === 'definition') {
    pageData.tagsDefined = tags.filter(tag => tag.definition);
    pageData.tagsUndefined = tags.filter(tag => !tag.definition);
  } else if (indexFormat === 'categories') {
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

    pageData.categoryList = [...Object.keys(categoryTags).sort(), 'none'];
    categoryTags.none = noCategory;
    pageData.categoryTags = categoryTags;
  }

  res.render('tag/index', pageData);
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
  const canDelete = await req.tag.canBeDeleted();
  const tags = await Tag.getAvailableForItem(req.tag);

  const tableRows = getEditTableRows({
    item: req.tag,
    rootPath: req.rootPath,
    fields: constants.fields,
    tags,
  });

  res.renderTag('edit', {
    itemName: 'tag',
    canDelete,
    tableRows,
  });
}

async function deleteTag(req, res) {
  await Tag.deleteOne({_id: req.tagId});
  res.redirect('/tags');
}
