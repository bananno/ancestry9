const {
  Citation,
  Highlight,
  Notation,
  Person,
  Source,
  Tag,
  getEditTableRows,
  sorting,
} = require('../import');

const constants = require('./constants');

module.exports = {
  show: personSummary,
  edit: personEdit,
  other: {
    checklist: require('./profile.checklist'),
    connection: personConnection,
    descendants: require('./profile.descendants'),
    mentions: personMentions,
    nationality: personNationality,
    notations: personNotations,
    relatives: personRelatives,
    sources: require('./profile.sources'),
    'sources/:subview': require('./profile.sources'),
    timeline: require('./profile.timeline'),
    wikitree: personWikitree,
  }
};

async function personSummary(req, res) {
  const person = await Person.findById(req.personId)
    .populate('parents').populate('spouses')
    .populate('children').populate('tags');

  req.person = person;

  const allPeople = await Person.find({});
  const people = Person.removeFromList(allPeople, person);
  const events = await person.getLifeEvents();

  const citations = await Citation.find({person}).populate('source');

  await person.populateSiblings(person);

  await Citation.populateStories(citations);

  Citation.sortByItem(citations);

  res.renderPersonProfile('summary', {
    citations,
    events,
    findPersonInList: Person.findInList,
    people,
  });
}

async function personEdit(req, res) {
  req.person = await Person.findById(req.personId)
    .populate('parents')
    .populate('spouses')
    .populate('children')
    .populate('tags');

  const unlinkedPeople = await req.person.getNonRelatives();

  const tableRows = await getEditTableRows({
    item: req.person,
    rootPath: req.rootPath,
    unlinkedPeople,
  });

  res.renderPersonProfile('edit', {
    tableRows,
    missingLinks: req.person.getMissingLinks(),
    itemName: 'person',
  });
}

async function personNotations(req, res) {
  const person = req.person;
  const notations = await Notation.find({people: person}).populate('tags');
  res.renderPersonProfile('notations', {notations});
}

async function personNationality(req, res) {
  const allPeople = await Person.find({}).populate('parents');

  const people = [];

  const person = Person.populateAncestors(req.person, allPeople, {intoList: people});

  await Person.populateBirthAndDeath(people, {populateDeath: false});

  people.forEach(person => {
    person.birthCountry = person.getBirthCountry() || 'unknown';
  });

  const nationality = Person.calculateNationality(person, people);

  const nationalityCountries = Object.keys(nationality)
    .filter(key => key !== 'unknown')
    .map(country => ({country, percentage: nationality[country]}));

  sorting.sortBy(nationalityCountries, country => 100 - country.percentage);

  res.renderPersonProfile('nationality', {
    people,
    nationalityCountries,
    unknownPercentage: nationality.unknown,
    findPersonInList: Person.findInList,
  });
}

async function personRelatives(req, res) {
  const person = await Person.findById(req.personId)
    .populate('parents').populate('spouses').populate('children');

  const people = await Person.find({})
    .populate('parents').populate('spouses').populate('children');

  const relativeList = person.getRelativesList(people);

  res.renderPersonProfile('relatives', {people, relativeList});
}

async function personConnection(req, res) {
  const people = await Person.find({});
  const person = Person.findInList(people, req.personId);
  const compare = people.find(nextPerson => nextPerson.isRoot());

  res.renderPersonProfile('connection', {
    compare,
    people,
    findPerson: person => Person.findInList(people, person),
    isSamePerson: Person.isSame,
  });
}

async function personWikitree(req, res) {
  await req.person.populateWikiTreeSources();
  res.renderPersonProfile('wikitree');
}

async function personMentions(req, res) {
  await req.person.populateHighlightMentions();
  res.renderPersonProfile('mentions');
}
