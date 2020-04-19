const mongoose = require('mongoose');
const methods = {};
module.exports = methods;

methods.getAllSharedData = async () => {
  const stories = await mongoose.model('Story').find({sharing: true})
    .populate('people').populate('images');

  return stories.map(story => story.toSharedObject());
};
