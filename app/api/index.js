const {
  Citation,
  Event,
  Notation,
  Person,
  Source,
  Story,
  Tag,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/api/event-index', eventIndex);
  router.get('/api/notation-index', notationIndex);
  router.get('/api/notation-profile/:id', notationProfile);
  router.get('/api/person-index', personIndex);
  router.get('/api/person-profile/:id', personProfile);
  router.get('/api/source-index', sourceIndex);
  router.get('/api/source-index/:sourceType', sourceIndex);
  router.get('/api/source-profile/:id', sourceProfile);
  router.get('/api/story-index', storyIndex);
  router.get('/api/story-index/:storyType', storyIndex);
  router.get('/api/story-non-entry-source', storyWithNonEntrySource);
  router.get('/api/story-profile/:id', storyProfile);
  router.get('/api/tag-index', tagIndex);
  router.get('/api/tag-profile/:id', tagProfile);
}

async function eventIndex(req, res) {
  const events = await Event.find();
  const data = events.map(event => ({
    id: event._id,
    title: event.title,
  }));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function notationIndex(req, res) {
  const notations = await Notation.find();
  const data = notations.map(notation => ({
    id: notation._id,
    title: notation.title,
  }));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function notationProfile(req, res) {
  const notation = await Notation
    .findById(req.params.id)
    .populate('people')
    .populate('stories')
    .populate('tags');
  const data = {
    id: notation._id,
    title: notation.title,
    sharing: notation.sharing,
    text: notation.text,
    people: mapPeopleToNameAndId(notation.people),
    stories: notation.stories.map(story => ({id: story._id, title: story.title})),
    tags: notation.convertTags({asList: true}),
  };
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function personIndex(req, res) {
  const people = await Person.find();
  const data = people.map(person => ({
    id: person._id,
    name: person.name,
  }));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function personProfile(req, res) {
  const personId = req.params.id;
  const person = await Person.findById(personId)
    .populate('parents').populate('spouses')
    .populate('children').populate('tags');
  await person.populateSiblings({sortByBirthDate: true});

  await person.populateCitations({populateSources: true});
  await Citation.populateStories(person.citations);
  Citation.sortByItem(person.citations);

  const data = {
    name: person.name,
    shareLevel: person.shareLevel,
    parents: mapPeopleToNameAndId(person.parents),
    siblings: mapPeopleToNameAndId(person.siblings),
    spouses: mapPeopleToNameAndId(person.spouses),
    children: mapPeopleToNameAndId(person.children),
    links: mapLinks(person.links),
    tags: person.convertTags({asList: true}),
    citations: mapCitationsIncludeSource(person.citations),
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function sourceIndex(req, res) {
  // TO DO: use mainSourceTypes to populate the list on the front end?
  const sourceType = req.params.sourceType;
  const sources = await Source.getAllByType(sourceType);
  sources.forEach(source => source.populateFullTitle());
  Source.sortByStory(sources);

  const data = sources.map(source => ({
    id: source._id,
    title: source.title,
    fullTitle: source.fullTitle,
  }));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function sourceProfile(req, res) {
  const source = await Source.findById(req.params.id)
    .populate('people')
    .populate('story');

  await source.populateAndSortCitations();

  const data = {
    id: source._id,
    citations: mapCitationsIncludePerson(source.citationsByPerson),
    content: source.content,
    date: source.date,
    links: mapLinks(source.links),
    location: source.location,
    notes: splitNotes(source.notes),
    people: mapPeopleToNameAndId(source.people),
    sharing: source.sharing,
    tags: source.convertTags({asList: true}),
    title: source.title,
    story: {
      id: source.story._id,
      title: source.story.title,
      type: source.story.type,
    },
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function storyIndex(req, res) {
  // TO DO: use mainStoryTypes to populate the list on the front end?
  const storyType = req.params.storyType;
  const stories = await Story.getAllByType(storyType);
  const data = stories.map(story => ({
    id: story._id,
    title: story.title,
  }));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function storyWithNonEntrySource(req, res) {
  const stories = await Story.getWithNonEntrySources();
  const data = stories.map(story => ({
    id: story._id,
    title: story.title,
    sources: story.sources.map(source => ({
      id: source._id,
      fullTitle: source.fullTitle,
    })),
  }));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function storyProfile(req, res) {
  const story = await Story
    .findById(req.params.id)
    .populate('people')
    .populate('tags');

  await story.populateEntries();
  await story.populateNonEntrySources();
  story.nonEntrySources.forEach(source => source.populateFullTitle());

  const data = {
    id: story._id,
    content: story.content,
    date: story.date,
    links: mapLinks(story.links),
    location: story.location,
    notes: splitNotes(story.notes),
    people: mapPeopleToNameAndId(story.people),
    sharing: story.sharing,
    tags: story.convertTags({asList: true}),
    title: story.title,
    type: story.type,
    entries: story.entries.map(source => ({
      id: source.id,
      title: source.title,
    })),
    nonEntrySources: story.nonEntrySources.map(source => ({
      id: source.id,
      fullTitle: source.fullTitle,
    })),
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function tagIndex(req, res) {
  const tags = await Tag.find({});
  Tag.sortByTitle(tags);
  await Tag.populateUsageCount(tags);

  const data = tags.map(tag => ({
    id: tag._id,
    category: tag.category,
    definition: tag.definition,
    restrictedToModels: tag.getRestrictedModelList(),
    title: tag.title,
    usageCount: tag.usageCount,
  }));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function tagProfile(req, res) {
  const tag = await Tag.findById(req.params.id).populate('tags');
  await tag.populateAllAttachedItems();

  const data = {
    id: tag._id,
    attachedItems: tag.attachedItems,
    category: tag.category,
    definition: tag.definition?.split('\n') || [],
    groupByValue: tag.hasTag('group by value'),
    missingItems: tag.missingItems,
    restrictedToModels: tag.getRestrictedModelList(),
    showMissingItems: tag.hasTag('show missing items'),
    tags: tag.convertTags({asList: true}),
    title: tag.title,
    valueOptions: tag.valueType === 2 ? tag.values.split('\n') : [],
    valueType: tag.valueType,
    valueTypeName: tag.getDropdownFieldValueName('valueType'),
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

////////////////////

function mapCitationsIncludePerson(citations) {
  return citations.map(citation => ({
    id: citation._id,
    information: citation.information,
    ...splitCitationItem(citation),
    person: {
      id: citation.person._id,
      name: citation.person.name,
    },
  }));
}

function mapCitationsIncludeSource(citations) {
  return citations.map(citation => ({
    id: citation._id,
    information: citation.information,
    ...splitCitationItem(citation),
    source: {
      id: citation.source._id,
      fullTitle: citation.source.fullTitle,
    },
  }));
}

function splitCitationItem(citation) {
  const arr = citation.item.split(' - ');
  return {itemPart1: arr.shift(), itemPart2: arr.join(' ')};
}

function mapLinks(links) {
  return links.map(link => {
    const arr = link.split(' ');
    return {url: arr.shift(), text: arr.join(' ')};
  });
}

function mapPeopleToNameAndId(people) {
  return people.map(person => ({id: person._id, name: person.name}));
}

function splitNotes(notes) {
  if (!notes) {
    return [];
  }
  return notes.split('\n').map(s => s.trim()).filter(Boolean);
}
