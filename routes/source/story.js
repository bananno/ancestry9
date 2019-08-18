const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const Source = mongoose.model('Source');
const Person = mongoose.model('Person');

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
  toggleAttributes: ['sharing'],
  singleAttributes: ['type', 'group', 'title', 'date', 'location',
    'notes', 'summary'],
  listAttributes: ['people', 'links', 'images', 'tags'],
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
  Source.findById(storyId).populate('people').exec((err, story) => {
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
  Source.findById(storyId).populate('people').exec((err, story) => {
    Person.find({}, (err, people) => {
      res.render('layout', {
        view: 'story/layout',
        subview: 'edit',
        title: story.title,
        story: story,
        people: people,
      });
    });
  });
}
