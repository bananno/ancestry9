const {
  Source,
  Story,
  Tag,
  getEditTableRows,
} = require('../import');

const constants = require('./constants');

module.exports = {
  summary: renderSummary,
  edit: renderEdit,
  other: {
    fastCitations: renderFastCitations,
    highlights: renderHighlights,
    notations: renderNotations,
  }
};

async function renderSummary(req, res) {
  req.source = await Source.findById(req.sourceId)
    .populate('story')
    .populate('stories')
    .populate('people')
    .populate('images')
    .populate('tags');

  await req.source.populateCiteText({storyFirst: true});
  await req.source.populateAndSortCitations();
  await req.source.populateAndProcessHighlights();

  res.renderSource('show');
}

async function renderEdit(req, res) {
  req.source = await Source.findById(req.sourceId)
    .populate('story')
    .populate('stories')
    .populate('images')
    .populate('people')
    .populate('tags');

  const source = req.source;
  await source.populateCiteText({includeStory: false});

  const stories = await Story.getAllSortedByTitle();

  await source.populateAndSortCitations();

  // allPeople - the dropdown for new notations (not part of EditTable).
  // unlinkedPeople - the dropdown for linking additional people to the source.
  const {allPeople, unlinkedPeople} = await source.getPeopleForDropdown();

  const tags = await Tag.find();
  Tag.sortByTitle(tags);

  const tableRows = getEditTableRows({
    item: req.source,
    rootPath: req.rootPath,
    fields: constants.fields,
    unlinkedPeople,
    tags,
    stories,
  });

  res.renderSource('edit', {
    title: 'Edit Source',
    itemName: 'source',
    people: allPeople,
    unlinkedPeople,
    needCitationText: source.story.title.match('Census')
      && source.citeText.length == 0,
    citationTextPath: '/source/' + source._id + '/createCitationNotation',
    tableRows,
    canDelete: req.source.canBeDeleted(),
  });
}

async function renderFastCitations(req, res) {
  req.source = await Source.findById(req.sourceId)
    .populate('story')
    .populate('people');

  await req.source.populateAndSortCitations();

  res.renderSource('fastCitations', {
    title: 'Edit Source',
    sourceCitationToDoList: req.source.getFastCitationToDoList(),
  });
}

async function renderHighlights(req, res) {
  req.source = await Source.findById(req.sourceId)
    .populate('story')
    .populate('people');

  await req.source.populateCitations();
  await req.source.populateAndProcessHighlights();

  const {allPeople} = await req.source.getPeopleForDropdown();
  const stories = await Story.getAllSortedByTitle();

  res.renderSource('highlights', {allPeople, stories});
}

async function renderNotations(req, res) {
  req.source = await Source.findById(req.sourceId).populate('story');

  await req.source.populateNotationsInCategories();

  res.renderSource('notations');
}
