const {
  Citation,
  Notation,
  Person,
  Source,
  Story,
} = require('../import');

const sourceTools = require('./tools');

module.exports = {
  summary: renderSummary,
  edit: renderEdit,
  other: {
    fastCitations: renderFastCitations,
    mentions: renderMentions,
    notations: renderNotations,
  }
};

async function renderSummary(req, res) {
  req.source = await Source.findById(req.sourceId)
    .populate('story')
    .populate('stories')
    .populate('people')
    .populate('images');

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
    .populate('people');

  const source = req.source;

  await source.populateCiteText({includeStory: false});

  const stories = await Story.find({});
  stories.sort((a, b) => a.title < b.title ? -1 : 1);

  await source.populateCitations();
  const citationsByPerson = [...source.citations];
  Citation.sortByItem(source.citations, source.people);
  Citation.sortByPerson(citationsByPerson, source.people);

  const people = await source.getPeopleForNewCitations();

  res.renderSource('edit', {
    title: 'Edit Source',
    rootPath: '/source/' + source._id,
    sourceFields: sourceTools.sourceFields,
    people,
    stories,
    citationsByPerson,
    needCitationText: source.story.title.match('Census')
      && source.citeText.length == 0
  });
}

async function renderFastCitations(req, res) {
  req.source = await Source.findById(req.sourceId)
    .populate('story')
    .populate('people');

  const source = req.source;

  let people = await Person.find({});

  source.people.forEach(thisPerson => {
    people = Person.removeFromList(people, thisPerson);
  });

  Person.sortByName(people);

  people = [...source.people, ...people];

  await source.populateCitations();
  const citationsByPerson = [...source.citations];
  Citation.sortByItem(source.citations, source.people);
  Citation.sortByPerson(citationsByPerson, source.people);

  res.renderSource('fastCitations', {
    title: 'Edit Source',
    people,
    citationsByPerson,
  });
}

async function renderMentions(req, res) {
  req.source = await Source.findById(req.sourceId).populate('story');

  const source = req.source;

  const notations = await Notation.find({source, tags: 'mentions'})
    .populate('people');

  res.renderSource('mentions', {notations});
}

async function renderNotations(req, res) {
  req.source = await Source.findById(req.sourceId).populate('story');

  const source = req.source;

  const notations = await Notation.find({source})
    .populate('people')
    .populate('stories');

  res.renderSource('notations', {notations});
}
