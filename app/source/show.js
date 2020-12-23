const {
  Citation,
  Notation,
  Person,
  Source,
  Story,
  Tag,
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

  const source = req.source;

  await source.populateCiteText({storyFirst: true});

  await source.populateCitations();
  const citationsByPerson = [...source.citations];
  Citation.sortByItem(source.citations, source.people);
  Citation.sortByPerson(citationsByPerson, source.people);

  res.renderSource('show', {citationsByPerson});
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

  const stories = await Story.find({});
  stories.sort((a, b) => a.title < b.title ? -1 : 1);

  await source.populateCitations();
  const citationsByPerson = [...source.citations];
  Citation.sortByItem(source.citations, source.people);
  Citation.sortByPerson(citationsByPerson, source.people);

  await source.populateHighlights();

  const {allPeople, unlinkedPeople} = await source.getPeopleForDropdown();

  const tags = await Tag.find({});
  Tag.sortByTitle(tags);

  res.renderSource('edit', {
    title: 'Edit Source',
    rootPath: '/source/' + source._id,
    fields: constants.fields,
    people: allPeople,
    unlinkedPeople,
    stories,
    citationsByPerson,
    needCitationText: source.story.title.match('Census')
      && source.citeText.length == 0,
    citationTextPath: '/source/' + source._id + '/createCitationNotation',
    tags,
  });
}

async function renderFastCitations(req, res) {
  req.source = await Source.findById(req.sourceId)
    .populate('story')
    .populate('people');

  const source = req.source;

  await source.populateCitations();
  const citationsByPerson = [...source.citations];
  Citation.sortByItem(source.citations, source.people);
  Citation.sortByPerson(citationsByPerson, source.people);

  res.renderSource('fastCitations', {
    title: 'Edit Source',
    citationsByPerson,
  });
}

async function renderHighlights(req, res) {
  req.source = await Source.findById(req.sourceId)
    .populate('story').populate('people');

  await req.source.populateCitations();
  await req.source.populateAndProcessHighlights();

  const {allPeople} = await req.source.getPeopleForDropdown();

  res.renderSource('highlights', {allPeople});
}

async function renderNotations(req, res) {
  req.source = await Source.findById(req.sourceId).populate('story');

  const source = req.source;

  const notations = await Notation.find({source})
    .populate('people')
    .populate('stories');

  res.renderSource('notations', {notations});
}
