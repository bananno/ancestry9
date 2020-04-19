const mongoose = require('mongoose');
const methods = {};
module.exports = methods;

methods.getAllSharedData = async () => {
  const stories = await mongoose.model('Story').find({sharing: true})
    .populate('people').populate('images');

  return stories.map(story => story.toSharedObject());
};

methods.getFormDataNew = req => {
  const storyType = req.body.type.trim();
  const storyTitle = req.body.title.trim();

  if (storyType === '' || storyTitle === '') {
    return false;
  }

  const newStory = {
    type: storyType,
    title: storyTitle,
    date: req.getFormDataDate(),
    location: req.getFormDataLocation(),
  };

  if (storyType === 'other') {
    newStory.type = req.body['type-text'].trim();
  }

  return newStory;
};
