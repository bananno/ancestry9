const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const methods = {};
module.exports = methods;

methods.getAllByParent = async () => {
  const sources = await mongoose.model('Source').find({}).populate('images');
  const stories = await mongoose.model('Story').find({}).populate('images');

  let images = [];

  sources.forEach(source => {
    source.images.forEach(image => image.source = source);
    images = images.concat(source.images);
  });

  stories.forEach(story => {
    story.images.forEach(image => image.story = story);
    images = images.concat(story.images);
  });

  return images;
};

methods.sortByTags = images => {
  tools.sorting.sortBy(images, image => {
    return [(20 - image.tags.length), ...image.tags].join('-');
  });
};
