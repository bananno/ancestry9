const mongoose = require('mongoose');
const {sorting} = require('../tools/modelTools');

const imageSchema = new mongoose.Schema({
  url: String,
  tags: [String],
  // Image actually belows to either a source or story.
});

imageSchema.methods.populateParent = async function() {
  this.source = await mongoose.model('Source').findOne({images: this})
    .populate('story');
  this.story = await mongoose.model('Story').findOne({images: this});
}

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
  sorting.sortBy(images, image => {
    return [(20 - image.tags.length), ...image.tags].join('-');
  });
};

mongoose.model('Image', imageSchema);
