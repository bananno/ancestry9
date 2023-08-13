const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const {modelsThatHaveTags} = require('./constants');

const methods = {};
module.exports = methods;

methods.sortByTitle = tools.sortByTitle;

methods.getAvailableForItem = async item => {
  const Tag = mongoose.model('Tag');
  const allTags = await Tag.find({});

  const itemTagIds = item.tags.map(tag => tag._id || tag);
  const modelName = item.constructor.modelName;

  const tags = allTags.filter(tag => {
    return !itemTagIds.includes(tag._id) && tag.isModelAllowed(modelName);
  });

  Tag.sortByTitle(tags);

  return tags;
};

methods.getFormDataNew = req => {
  const storyTitle = req.body.title.trim();

  if (!storyTitle) {
    return false;
  }

  const newTag = {
    title: storyTitle,
  };

  return newTag;
};

// Given an ID or a title, find the tag. Populate its meta tags.
methods.findByIdOrTitle = async(tagId) => {
  const Tag = mongoose.model('Tag');

  if (tools.isValidMongooseId(tagId)) {
    const tag = await Tag.findById(tagId).populate('tags');
    if (tag) {
      return tag;
    }
  }

  const tryTitle = tagId.replace(/_/g, ' ').replace(/%20/g, ' ');
  const tagByName = await Tag.findOne({title: tryTitle}).populate('tags');

  return tagByName;
};

// Given a list of tags, populate the usage count for each.
methods.populateUsageCount = async tags => {
  const tagRef = {};

  tags.forEach(tag => {
    tag.usageCount = 0;
    tagRef[tag._id] = tag;
  });

  await forEachModel(async Model => {
    const items = await Model.find({});

    items.forEach(item => {
      item.tags.forEach(tagId => {
        tagRef[tagId].usageCount += 1;
      });
    });
  });
};

/////////////////////

async function forEachModel(callback) {
  for (let i in modelsThatHaveTags) {
    const modelName = modelsThatHaveTags[i].name;
    const Model = mongoose.model(modelName);
    const pluralName = modelsThatHaveTags[i].plural;
    await callback(Model, modelName, pluralName);
  }
}
