const {
  Person,
  Notation,
  Story,
  Source,
  Tag,
  createController,
  getEditTableRows,
} = require('../import');

const constants = require('./constants');
const storyTools = require('./tools');
const storyChecklist = require('./checklist');

module.exports = createRoutes;

function createRoutes(router) {
  router.use(storyTools.createRenderStory);

  createController({
    Model: Story,
    modelName: 'story',
    modelNamePlural: 'stories',
    router: router,
    routes: {
      index: storyIndex,
      create: createStory,
      show: storyShowMain,
      edit: storyEdit,
      other: {
        entries: storyEntries,
        newEntry: storyNewEntry,
        notations: storyNotations,
        checklist: storyChecklist,
        mentions: storyHighlightMentions,
      },
    },
  });

  router.post('/story/:id/createNotation', createStoryNotation);
  router.get('/stories/with-sources', storiesWithSources);
  router.get('/stories/:type', storyIndex);
}

async function storyIndex(req, res) {
  const storyType = req.params.type;
  const stories = await Story.getAllByType(storyType);

  Story.sortByTypeTitle(stories);

  res.render('story/index', {
    title: 'Stories',
    stories,
    subview: storyType,
    mainStoryTypes: [...constants.mainStoryTypes, 'other'],
  });
}

function createStory(req, res) {
  const newStory = Story.getFormDataNew(req);

  if (!newStory) {
    return res.send('error');
  }

  Story.create(newStory, (err, story) => {
    res.redirect('/story/' + story._id + '/edit');
  });
}

async function createStoryNotation(req, res) {
  const storyId = req.params.id;
  const newNotation = Notation.getFormDataNew(req);
  newNotation.stories.push(storyId);
  await Notation.create(newNotation);
  res.redirect('/story/' + storyId + '/notations');
}

async function storyShowMain(req, res) {
  req.story = await Story.findById(req.params.id)
    .populate('people')
    .populate('images')
    .populate('tags');
  await req.story.populateCiteText();
  await req.story.populateNonEntrySources();
  res.renderStory('show');
}

async function storyEdit(req, res) {
  req.story = await Story.findById(req.params.id)
    .populate('people')
    .populate('images')
    .populate('tags');

  req.rootPath = '/story/' + req.story._id;

  const tableRows = await getEditTableRows({
    item: req.story,
    rootPath: req.rootPath,
  });

  res.renderStory('edit', {
    itemName: 'story',
    tableRows,
  });
}

async function storyEntries(req, res) {
  req.story = await Story.findById(req.params.id).populate('tags');
  await req.story.populateEntries({populateImages: true});
  req.story.entries.sort((a, b) => a.title < b.title ? -1 : 1);
  res.renderStory('entries');
}

async function storyNewEntry(req, res) {
  req.story = await Story.findById(req.params.id).populate('tags');
  res.renderStory('newEntry', {actionPath: '/sources/new'});
}

async function storyNotations(req, res) {
  req.story = await Story.findById(req.params.id).populate('tags');
  await req.story.populateNotations();

  const notations = {};

  req.story.notations.forEach(notation => {
    const category = notation.getCategoryForStory();
    notations[category] = (notations[category] || []).concat(notation);
  });

  res.renderStory('notations', {notations});
}

async function storyHighlightMentions(req, res) {
  req.story = await Story.findById(req.params.id);
  await req.story.populateHighlightMentions();
  res.renderStory('mentions');
}

function storiesWithSources(req, res) {
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
