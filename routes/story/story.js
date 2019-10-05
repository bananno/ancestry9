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
  'newspapers', 'websites', 'places', 'other',
];

const noEntryStoryTypes = ['artifact', 'event', 'landmark', 'place'];

createModelRoutes({
  Model: Story,
  modelName: 'story',
  modelNamePlural: 'stories',
  router: router,
  index: getStoriesIndexRoute('all'),
  create: createStory,
  show: storyShowMain,
  edit: storyEdit,
  toggleAttributes: ['sharing'],
  singleAttributes: ['type', 'group', 'title', 'date', 'location',
    'notes', 'summary', 'content'],
  listAttributes: ['people', 'links', 'images', 'tags'],
});

mainStoryTypes.forEach(type => {
  router.get('/stories/' + type, getStoriesIndexRoute(type));
});

router.get('/story/:id/entries', storyEntries);
router.get('/story/:id/newEntry', storyNewEntry);
router.get('/stories/with-sources', storiesWithSources);

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
    'places': 'place',
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

function withStory(req, res, options, callback) {
  const storyId = req.params.id;
  Story.findById(storyId).populate('people').exec((err, story) => {
    if (!story) {
      return res.send('Story not found');
    }
    if (options.entries) {
      Source.find({ story: story }).exec((err, entries) => {
        entries.sort((a, b) => a.title < b.title ? -1 : 1);
        if (options.sources) {
          Source.find({ stories: story }).populate('story')
          .exec((err, sources) => {
            callback({story, entries, sources});
          });
        } else {
          callback({story, entries});
        }
      });
    } else {
      callback({story});
    }
  });
}

function mainStoryView(res, story, params) {
  res.render('layout', {
    view: 'story/layout',
    title: story.title,
    story: story,
    rootPath: '/story/' + story._id,
    canHaveDate: story.type != 'cemetery',
    canHaveEntries: !noEntryStoryTypes.includes(story.type),
    ...params
  });
}

function storyShowMain(req, res) {
  withStory(req, res, {
    entries: true, sources: true
  }, ({story, entries, sources}) => {
    mainStoryView(res, story, {
      subview: 'show',
      entries,
      sources,
    });
  });
}

function storyEdit(req, res) {
  withStory(req, res, {}, ({story}) => {
    Person.find({}, (err, people) => {
      mainStoryView(res, story, {
        subview: 'edit',
        people: people,
      });
    });
  });
}

function storyEntries(req, res, next) {
  withStory(req, res, { entries: true }, ({story, entries}) => {
    mainStoryView(res, story, {
      subview: 'entries',
      entries: entries,
    });
  });
}

function storyNewEntry(req, res, next) {
  withStory(req, res, { entries: true }, ({story, entries}) => {
    let sourceType = {
      website: 'article',
      book: 'book',
      document: 'document',
      cemetery: 'grave',
      index: 'index',
      newspaper: 'newspaper',
    }[story.type] || 'other';

    const entryCanHaveDate = !['cemetery'].includes(story.type);
    const entryCanHaveLocation = !['cemetery', 'newspaper'].includes(story.type);

    mainStoryView(res, story, {
      subview: 'newEntry',
      actionPath: '/sources/new',
      entries,
      entryCanHaveDate,
      entryCanHaveLocation,
      sourceType,
    });
  });
}

function storiesWithSources(req, res, next) {
  Source.find({})
  .populate('story')
  .populate('stories')
  .exec((err, allSources) => {
    const stories = [];
    const sourcesByStory = {};

    allSources.forEach(source => {
      source.stories.forEach(story => {
        const id = '' + story._id;
        if (!sourcesByStory[id]) {
          stories.push(story);
          sourcesByStory[id] = [];
        }
        sourcesByStory[id].push(source);
      });
    });

    res.render('layout', {
      view: 'story/withSources',
      title: 'Stories with Sources',
      stories,
      sourcesByStory,
    });
  });
}
