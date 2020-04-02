const {
  Citation,
  Notation,
  Person,
  Source,
  Story,
  sortPeople,
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

  const citations = await Citation.find({source}).populate('person');
  const citationsByPerson = [...citations];
  Citation.sortByItem(citations, source.people);
  Citation.sortByPerson(citationsByPerson, source.people);

  res.renderSource('show', {citations, citationsByPerson});
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

  const citations = await Citation.find({source}).populate('person');
  const citationsByPerson = [...citations];
  Citation.sortByItem(citations, source.people);
  Citation.sortByPerson(citationsByPerson, source.people);

  const allPeople = await Person.find({});
  const people = sourceTools.sortPeopleForNewCitations(source, allPeople,
    citations);

  res.renderSource('edit', {
    title: 'Edit Source',
    people,
    stories,
    citations,
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
  sortPeople(people, 'name');
  source.people.forEach(thisPerson => {
    people = Person.removeFromList(people, thisPerson);
  });
  people = [...source.people, ...people];

  const citations = await Citation.find({source}).populate('person');
  const citationsByPerson = [...citations];
  Citation.sortByItem(citations, source.people);
  Citation.sortByPerson(citationsByPerson, source.people);

  res.renderSource('fastCitations', {
    title: 'Edit Source',
    people,
    citations,
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
