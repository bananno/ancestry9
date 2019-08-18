const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const Source = mongoose.model('Source');

const getTools = (path) => { return require('../../tools/' + path) };
const createModelRoutes = getTools('createModelRoutes');

createModelRoutes({
  Model: Source,
  modelName: 'story',
  modelNamePlural: 'stories',
  router: router,
  index: storiesIndex,
  create: null,
  show: showStory,
  edit: null,
  toggleAttributes: [],
  singleAttributes: [],
  listAttributes: [],
});

function storiesIndex(req, res, next) {
  mongoose.model('Source').find({ type: 'story' }, (err, stories) => {
    stories.sort((a, b) => {
      return a.group < b.group ? -1 : 1;
    });
    res.render('layout', {
      view: 'sources/stories',
      title: 'Stories',
      stories: stories,
      showNew: false,
      mainSourceTypes: [],
    });
  });
}

function showStory(req, res) {
  const storyId = req.params.id;
  Source.findById(storyId, (err, story) => {
    res.render('layout', {
      view: 'sources/story',
      title: story.title,
      story: story,
    });
  });
}
