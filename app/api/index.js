const {
  Person,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/api/people-index', peopleIndex);
  router.get('/api/person-profile/:id', personProfile);
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
    .populate('tags');
  await person.populateSiblings();

  const data = {
    name: person.name,
    shareLevel: person.shareLevel,
    parents: person.parents.map(parent => ({id: parent._id, name: parent.name})),
    siblings: person.siblings.map(sibling => ({id: sibling._id, name: sibling.name})),
    spouses: person.spouses.map(spouse => ({id: spouse._id, name: spouse.name})),
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
