const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const Story = mongoose.model('Story');
const Source = mongoose.model('Source');
const Person = mongoose.model('Person');

const getTools = (path) => { return require('../../tools/' + path) };
const createModelRoutes = getTools('createModelRoutes');
const getDateValues = getTools('getDateValues');
const getLocationValues = getTools('getLocationValues');

createModelRoutes({
  Model: Story,
  modelName: 'story',
  modelNamePlural: 'stories',
  router: router,
  index: storiesIndex,
  create: createStory,
  show: showStory,
  edit: editStory,
  toggleAttributes: ['sharing'],
  singleAttributes: ['type', 'group', 'title', 'date', 'location',
    'notes', 'summary'],
  listAttributes: ['people', 'links', 'images', 'tags'],
});

function storiesIndex(req, res, next) {
  Story.find({}, (err, stories) => {
    stories.sort((a, b) => {
      return (a.type + a.title) < (b.type + b.title) ? -1 : 1;
    });
    res.render('layout', {
      view: 'story/index',
      title: 'Stories',
      stories: stories,
    });
  });
}

function createStory(req, res, next) {
  const newStory = {
    type: req.body.type,
    title: req.body.title.trim(),
    date: getDateValues(req),
    location: getLocationValues(req),
  };

  if (newStory.type == 'other') {
    newStory.type = req.body['type-text'].trim();
  }

  if (newStory.type.length == 0 || newStory.title.length == 0) {
    return res.send('Type and title are required.');
  }

  Story.create(newStory, (err, story) => {
    res.redirect('/story/' + story._id + '/edit');
  });
}

function withStory(req, res, callback) {
  const storyId = req.params.id;
  Story.findById(storyId).populate('people').exec((err, story) => {
    if (!story) {
      return res.send('Story not found');
    }
    callback(story, storyId);
  });
}

function showStory(req, res) {
  withStory(req, res, story => {
    Source.find({ story: story }).exec((err, entries) => {
      entries.sort((a, b) => a.title < b.title ? -1 : 1);
      res.render('layout', {
        view: 'story/layout',
        subview: 'show',
        title: story.title,
        story: story,
        entries: entries,
        canHaveDate: story.type != 'cemetery',
      });
    });
  });
}

function editStory(req, res) {
  withStory(req, res, story => {
    Person.find({}, (err, people) => {
      res.render('layout', {
        view: 'story/layout',
        subview: 'edit',
        title: story.title,
        story: story,
        people: people,
        canHaveDate: story.type != 'cemetery',
      });
    });
  });
}
