const {
  Event,
  Notation,
  Person,
  Source,
  Story,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/api/event-index', eventIndex);
  router.get('/api/notation-index', notationIndex);
  router.get('/api/people-index', peopleIndex);
  router.get('/api/person-profile/:id', personProfile);
  router.get('/api/source-index', sourceIndex);
  router.get('/api/source-profile/:id', sourceProfile);
  router.get('/api/story-index', storyIndex);
  router.get('/api/story-profile/:id', storyProfile);
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

async function peopleIndex(req, res) {
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

  const data = {
    name: person.name,
    shareLevel: person.shareLevel,
    parents: person.parents.map(parent => ({id: parent._id, name: parent.name})),
    siblings: person.siblings.map(sibling => ({id: sibling._id, name: sibling.name})),
    spouses: person.spouses.map(spouse => ({id: spouse._id, name: spouse.name})),
    children: person.children.map(child => ({id: child._id, name: child.name})),
    links: person.links.map(link => {
      const arr = link.split(' ');
      return {url: arr.shift(), text: arr.join(' ')};
    }),
    tags: person.convertTags({asList: true}),
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function sourceIndex(req, res) {
  const sources = await Source.find().populate('story');
  sources.forEach(source => source.populateFullTitle());
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
  const data = {
    id: source._id,
    date: source.date,
    links: source.links.map(link => {
      const arr = link.split(' ');
      return {url: arr.shift(), text: arr.join(' ')};
    }),
    location: source.location,
    people: source.people.map(person => ({
      id: person._id,
      name: person.name,
    })),
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
  const stories = await Story.find();
  const data = stories.map(story => ({
    id: story._id,
    title: story.title,
  }));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}

async function storyProfile(req, res) {
  const story = await Story.findById(req.params.id).populate('tags');
  const data = {
    id: story._id,
    date: story.date,
    links: story.links.map(link => {
      const arr = link.split(' ');
      return {url: arr.shift(), text: arr.join(' ')};
    }),
    location: story.location,
    people: story.people.map(person => ({
      id: person._id,
      name: person.name,
    })),
    sharing: story.sharing,
    tags: story.convertTags({asList: true}),
    title: story.title,
    type: story.type,
    sources: [], // TO DO
  };
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}
