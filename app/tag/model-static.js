const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const methods = {};
module.exports = methods;

methods.sortByTitle = tools.sortByTitle;

methods.getAvailableForItem = async item => {
  const Tag = mongoose.model('Tag');
  const allTags = await Tag.find({});
  const itemTagIds = item.tags.map(tag => tag._id || tag);
  const tags = allTags.filter(tag => !itemTagIds.includes(tag._id));
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
