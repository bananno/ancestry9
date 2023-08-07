const {
  Person,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/api/people-index', peopleIndex);
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
