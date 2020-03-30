const mongoose = require('mongoose');
const Story = mongoose.model('Story');
const Source = mongoose.model('Source');
const Person = mongoose.model('Person');
const Notation = mongoose.model('Notation');
const tool = path => require('../../tools/' + path);
const createModelRoutes = tool('createModelRoutes');
const getDateValues = tool('getDateValues');
const getLocationValues = tool('getLocationValues');

const mainStoryTypes = [
  'book', 'cemetery', 'document', 'index',
  'newspaper', 'website', 'place', 'topic'
];

const noEntryStoryTypes = ['artifact', 'event', 'landmark', 'place'];

module.exports = createRoutes;

function createRoutes(router) {
  createModelRoutes({
    Model: Story,
    modelName: 'story',
    modelNamePlural: 'stories',
    router: router,
    index: storyIndex,
    create: createStory,
    show: storyShowMain,
    edit: storyEdit,
    otherRoutes: {
      'entries': storyEntries,
      'newEntry': storyNewEntry,
      'notations': storyNotations,
    },
    toggleAttributes: ['sharing'],
    singleAttributes: ['type', 'group', 'title', 'date', 'location',
      'notes', 'summary', 'content'],
    listAttributes: ['people', 'links', 'images', 'tags'],
  });

  router.post('/story/:id/createNotation', createStoryNotation);
  router.get('/stories/with-sources', storiesWithSources);
  router.get('/stories/:type', storyIndex);
}

function storyIndex(req, res, next) {
  const storyType = req.params.type;

  withAllStories(storyType, stories => {
    stories.sort((a, b) => {
      return (a.type + a.title) < (b.type + b.title) ? -1 : 1;
    });

    res.render('story/index', {
      title: 'Stories',
      stories,
      subview,
      mainStoryTypes: [...mainStoryTypes, 'other'],
    });
  });
}

function withAllStories(type, callback) {
  if (!type) {
    Story.find({}, (err, stories) => {
      callback(stories);
    });
  } else if (type == 'other') {
    Story.find({}, (err, stories) => {
      stories = stories.filter(story => {
        return !mainStoryTypes.includes(story.type);
      });
      callback(stories);
    });
  } else {
    Story.find({type}, (err, stories) => {
      callback(stories);
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

  Story.findById(storyId)
  .populate('people')
  .populate('images')
  .exec((err, story) => {
    if (!story) {
      return res.send('Story not found');
    }

    const data = { story };

    // ENTRIES (sources that belong to the story)
    new Promise(resolve => {
      if (!options.entries) {
        return resolve();
      }
      if (options.entryImages) {
        return Source.find({ story: story }).populate('images').exec((err, entries) => {
          entries.sort((a, b) => a.title < b.title ? -1 : 1);
          data.entries = entries;
          resolve();
        });
      }
      Source.find({ story: story }).exec((err, entries) => {
        entries.sort((a, b) => a.title < b.title ? -1 : 1);
        data.entries = entries;
        resolve();
      });
    // SOURCES (other pinned sources; don't belong to the story)
    }).then(() => {
      if (!options.sources) {
        return;
      }
      return new Promise(resolve => {
        Source.find({ stories: story })
        .populate('story')
        .exec((err, sources) => {
          data.sources = sources;
          resolve();
        });
      });
    // NOTATIONS
    }).then(() => {
      if (!options.notations && !options.citationText) {
        return;
      }
      return new Promise(resolve => {
        Notation
        .find({ stories: [story] })
        .exec((err, notations) => {
          // all notations
          if (options.notations) {
            data.notations = notations;
          }
          // citation text: offical text describing the origin of story/sources
          if (options.citationText) {
            data.citationText = notations
              .filter(notation => notation.title == 'source citation')
              .map(notation => notation.text);
          }
          resolve();
        });
      });
    }).then(() => {
      callback(data);
    });
  });
}

function createStoryNotation(req, res, next) {
  withStory(req, res, {}, ({story}) => {
    const newNotation = {
      title: req.body.title.trim(),
      text: req.body.text.trim(),
      stories: [story],
    };
    Notation.create(newNotation, (err, notation) => {
      if (err) {
        return res.send('There was a problem adding the information to the database.');
      }
      res.redirect('/story/' + story._id + '/notations');
    });
  });
}

function mainStoryView(res, story, params) {
  res.render('story/_layout', {
    title: story.title,
    story,
    rootPath: '/story/' + story._id,
    canHaveDate: story.type != 'cemetery',
    canHaveEntries: !noEntryStoryTypes.includes(story.type),
    ...params
  });
}

function storyShowMain(req, res) {
  withStory(req, res, {
    entries: true, sources: true, citationText: true
  }, ({story, entries, sources, citationText}) => {
    mainStoryView(res, story, {
      subview: 'show',
      entries,
      sources,
      citationText
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
  withStory(req, res, {
    entries: true,
    entryImages: true
  }, ({story, entries}) => {
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

function storyNotations(req, res, next) {
  withStory(req, res, {
    entries: true, notations: true
  }, ({ story, entries, notations }) => {
    mainStoryView(res, story, {
      subview: 'notations',
      entries,
      notations,
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

    res.render('story/withSources', {
      title: 'Stories with Sources',
      stories,
      sourcesByStory,
    });
  });
}
