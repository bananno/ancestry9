const {
  Citation,
  Event,
  Notation,
  Person,
  Source,
  Tag,
} = require('../import');

const constants = require('./constants');

module.exports = {
  show: personSummary,
  edit: personEdit,
  other: {
    sources: personSources,
    notations: personNotations,
    nationality: personNationality,
    relatives: personRelatives,
    connection: personConnection,
    wikitree: personWikitree,
    descendants: personDescendants,
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

  const allPeople = await Person.find({});
  const people = Person.removeFromList(allPeople, req.person);
  Person.sortByName(people);

  const tags = await Tag.getAvailableForItem(req.person);

  res.renderPersonProfile('edit', {
    people,
    fields: constants.fields,
    rootPath: '/person/' + req.paramPersonId,
    tags,
    missingLinks: req.person.getMissingLinks(),
  });
}

async function personSources(req, res) {
  const person = req.person;

  const sources = await Source.find({people: person})
    .populate('story').populate('images');

  for (let i in sources) {
    const source = sources[i];
    await source.populatePersonCitations(person);
    Citation.sortByItem(source.citations);
  }

  Source.sortByStory(sources);

  res.renderPersonProfile('sources', {sources});
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

  res.renderPersonProfile('nationality', {
    people,
    nationality,
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
  const person = req.person;

  const personSources = await Source.find({people: person}).populate('story');

  await Source.populateCiteText(personSources);

  const sources = personSources.filter(source => {
    return source.citeText.length || source.story.title.match('Census USA');
  });

  Source.sortByStory(sources);

  res.renderPersonProfile('wikitree', {sources});
}

async function personDescendants(req, res) {
  const monthNames = [
    null, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const people = await Person.find().populate('tags');

  await Person.populateBirthAndDeath(people);

  const marriageEvents = await Event.find({title: {$in: ['divorce', 'marriage']}});

  res.renderPersonProfile('descendants', {
    people,
    marriageEvents,
    findPersonInList: Person.findInList,
    getLifeDatesString,
    formatEventDate,
  });

  function getLifeDatesString(person) {
    const livingStr = person.living ? 'living' : undefined;
    return [
      formatEventDate(person.birth) || '?',
      formatEventDate(person.death) || livingStr || '?',
    ].join('-');
  }

  function formatEventDate(event) {
    if (event && event.date) {
      if (event.date.display) {
        return event.date.display;
      }
      const {day, month, year} = event.date;
      return [monthNames[month], day, year].filter(Boolean).join(' ');
    }
  }
}
