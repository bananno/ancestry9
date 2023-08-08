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
  router.get('/api/story-index', storyIndex);
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
    tagsOriginal: person.tags,
    tagValues: person.tags,
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

async function storyIndex(req, res) {
  const stories = await Story.find();
  const data = stories.map(story => ({
    id: story._id,
    title: story.title,
  }));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({data});
}
