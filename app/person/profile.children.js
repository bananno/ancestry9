const {
  Person,
} = require('../import');

module.exports = renderPersonChecklist;

async function renderPersonChecklist(req, res) {
  const person = await Person
    .findById(req.personId)
    .populate('children')
    .populate('tags');

  req.person = person;

  const data = {};

  const childrenTagValue = person.getTagValue('number of children');

  if (person.children.length === 0) {
    if (childrenTagValue === 'done') {
      data.neverHadChildren = true;
    } else {
      // add later
    }
  } else {
    if (childrenTagValue === 'done') {
      data.allChildrenInDatabase = true;
    }

    data.children = [...person.children];
    await Person.populateBirthAndDeath(data.children);
    Person.sortByBirth(data.children);
  }

  res.renderPersonProfile('children', data);
}

