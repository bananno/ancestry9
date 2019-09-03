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

const mainStoryTypes = [
  'books', 'cemeteries', 'documents', 'index',
  'newspapers', 'websites', 'other',
];

createModelRoutes({
  Model: Story,
  modelName: 'story',
  modelNamePlural: 'stories',
  router: router,
  index: getStoriesIndexRoute('all'),
  create: createStory,
  show: showStory,
  edit: editStory,
  toggleAttributes: ['sharing'],
  singleAttributes: ['type', 'group', 'title', 'date', 'location',
    'notes', 'summary'],
  listAttributes: ['people', 'links', 'images', 'tags'],
});

mainStoryTypes.forEach(type => {
  router.get('/stories/' + type, getStoriesIndexRoute(type));
});

router.get('/story/:id/entries', showStoryEntries);

function getStoriesIndexRoute(storyType) {
  return function(req, res, next) {
    withAllStories(storyType, stories => {
      stories.sort((a, b) => {
        return (a.type + a.title) < (b.type + b.title) ? -1 : 1;
      });
      res.render('layout', {
        view: 'story/index',
        title: 'Stories',
        stories: stories,
        subview: storyType,
        mainStoryTypes: mainStoryTypes,
      });
    });
  }
}

function withAllStories(type, callback) {
  const singular = {
    'books': 'book',
    'cemeteries': 'cemetery',
    'documents': 'document',
    'index': 'index',
    'newspapers': 'newspaper',
    'websites': 'website',
  };

  const singularType = singular[type];

  if (singularType) {
    Story.find({ type: singularType }, (err, stories) => {
      callback(stories);
    });
  } else {
    Story.find({}, (err, stories) => {
      if (type == 'other') {
        callback(stories.filter(story => {
          return ![
            'book', 'cemetery', 'document', 'index',
            'newspaper', 'website',
          ].includes(story.type);
        }));
      } else {
        callback(stories);
      }
    });
  }
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

function withStoryAndEntries(req, res, callback) {
  withStory(req, res, story => {
    Source.find({ story: story }).exec((err, entries) => {
      entries.sort((a, b) => a.title < b.title ? -1 : 1);
      callback(story, entries);
    });
  });
}

function showStory(req, res) {
  withStoryAndEntries(req, res, (story, entries) => {
    res.render('layout', {
      view: 'story/layout',
      subview: 'show',
      title: story.title,
      story: story,
      entries: entries,
      canHaveDate: story.type != 'cemetery',
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

function showStoryEntries(req, res, next) {
  withStoryAndEntries(req, res, (story, entries) => {
    res.render('layout', {
      view: 'story/layout',
      subview: 'entries',
      title: story.title,
      story: story,
      entries: entries,
    });
  });
}
