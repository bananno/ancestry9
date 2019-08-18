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
  edit: editStory,
  toggleAttributes: [],
  singleAttributes: [],
  listAttributes: [],
});

function storiesIndex(req, res, next) {
  Source.find({ type: 'story' }, (err, stories) => {
    stories.sort((a, b) => {
      return a.group < b.group ? -1 : 1;
    });
    res.render('layout', {
      view: 'story/index',
      title: 'Stories',
      stories: stories,
    });
  });
}

function showStory(req, res) {
  const storyId = req.params.id;
  Source.findById(storyId, (err, story) => {
    res.render('layout', {
      view: 'story/layout',
      subview: 'show',
      title: story.title,
      story: story,
    });
  });
}

function editStory(req, res) {
  const storyId = req.params.id;
  Source.findById(storyId, (err, story) => {
    res.render('layout', {
      view: 'story/layout',
      subview: 'edit',
      title: story.title,
      story: story,
    });
  });
}
