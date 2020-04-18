const mongoose = require('mongoose');
const tools = require('../modelTools');

const imageSchema = new mongoose.Schema({
  url: String,
  tags: [String],
});

imageSchema.statics.getAllByParent = async function() {
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

imageSchema.statics.sortByTags = function(images) {
  images.forEach(image => {
    image.sortBy = [(20 - image.tags.length), ...image.tags].join('-');
  });

  tools.sortBy(images, image => image.sortBy);
};

mongoose.model('Image', imageSchema);
