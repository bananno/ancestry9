const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const methods = {};
module.exports = methods;

// Given list of stories, return a list of all their entry sources.
methods.getAllEntries = async function(stories) {
  let entries = [];
  for (let i in stories) {
    const nextEntries = await stories[i].getEntries();
    entries = entries.concat(nextEntries);
  }
  return entries;
};

// Return a list of stories with given type.
methods.getAllByType = async function(type) {
  const Story = mongoose.model('Story');

  if (!type) {
    return await Story.find({}).populate('tags');
  }

  if (type == 'other') {
    return await Story
      .find({type: {$nin: constants.mainStoryTypes}})
      .populate('tags');
  }

  return await Story.find({type}).populate('tags');
};

methods.getAllSharedData = async () => {
  const stories = await mongoose.model('Story').find({sharing: true})
    .populate('people').populate('images');

  return stories.map(story => story.toSharedObject());
};

// Return a list of stories with "Census USA ___" title.
methods.getAllCensusUSA = async function() {
  return await mongoose.model('Story')
    .find({title: {$regex: 'Census USA.*'}});
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

// Sort by type, then title.
methods.sortByTypeTitle = function(stories) {
  tools.sortBy(stories, story => story.type + story.title);
};
