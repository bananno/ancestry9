const {
  Notation,
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

    // this line = INCOMPLETE?
    await getParentProfileSummaryNotations(data.children);
  }

  res.renderPersonProfile('children', data);
}

// this function = INCOMPLETE?
async function getParentProfileSummaryNotations(children) {
  const notations = await Notation.find({
    title: 'parent profile summary',
    people: {$in: children.map(person => person._id)},
  });

  notations.forEach(notation => {
    const person = children.find(child => child._id === notation.people[0]);
    person.parentSummaryNotation = notation;
  });

  // console.log(notations)
}
