const {
  Citation,
  Event,
  Notation,
  Person,
  Source,
  sortCitations,
  sortEvents,
} = require('../import');

const getTools = (path) => { return require('../../tools/' + path) };
const personTools = require('./tools');
const getPersonRelativesList = getTools('getPersonRelativesList');

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
  }
};

async function personSummary(req, res) {
  const person = await Person.findById(req.personId).populate('parents');

  req.person = person;

  const allPeople = await Person.find({});
  const people = Person.removeFromList(allPeople, person);
  const events = await Event.find({people: person}).populate('people');
  const citations = await Citation.find({person}).populate('source');

  await person.populateSiblings(person);

  await Citation.populateStories(citations);

  res.renderPersonProfile('summary', {
    events: sortEvents(events),
    citations: sortCitations(citations, 'item'),
    findPersonInList: Person.findInList,
    people,
  });
}

function personEdit(req, res) {
  Person
  .findById(req.personId)
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec((err, person) => {
    Person
    .find({})
    .exec((err, allPeople) => {
      const people = Person.removeFromList(allPeople, person);
      people.sort((a, b) => a.name < b.name ? -1 : 1);
      res.renderPersonProfile('edit', {people});
    });
  });
}

function personSources(req, res) {
  const person = req.person;
  Source
  .find({ people: person })
  .populate('story')
  .populate('images')
  .exec((err, sources) => {
    Citation
    .find({ person: person })
    .exec((err, citations) => {
      citations = sortCitations(citations, 'item');

      sources.sort((a, b) => {
        let sortA = a.story.type + ' - ' + a.story.title + ' - ' + a.title;
        let sortB = b.story.type + ' - ' + b.story.title + ' - ' + b.title;
        return sortA == sortB ? 0 : sortA > sortB ? 1 : -1;
      });

      res.renderPersonProfile('sources', {sources, citations});
    });
  });
}

async function personNotations(req, res) {
  const person = req.person;
  const notations = await Notation.find({people: person});
  res.renderPersonProfile('notations', {notations});
}

async function personNationality(req, res) {
  const people = await Person.find({})
    .populate('parents').populate('spouses').populate('children');

  for (let i in people) {
    const person = people[i];
    person.birthCountry = await getPersonBirthCountry(person);
  }

  const person = personTools.populateParents(req.personId, people);

  const nationality = calculateNationality(person, people);

  res.renderPersonProfile('nationality', {
    people,
    nationality,
    findPersonInList: Person.findInList,
  });
}

function personRelatives(req, res) {
  Person
  .find({})
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec(function(err, people) {
    const person = Person.findInList(people, req.personId);
    const relativeList = getPersonRelativesList(people, person);
    res.renderPersonProfile('relatives', {people, relativeList});
  });
}

async function personConnection(req, res) {
  const people = await Person.find({});
  const person = Person.findInList(people, req.personId);
  const compare = people.find(nextPerson => nextPerson.name === 'Anna Peterson');

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

async function getPersonBirthCountry(person) {
  const event = await Event.findOne({title: 'birth', people: person});

  if (event && (event.people[0] + '' === person._id + '')
      && event.location && event.location.country) {
    return event.location.country;
  }

  return 'unknown';
}

function calculateNationality(person, people, nationality, percentage, safety) {
  nationality = nationality || {};
  percentage = percentage || 100;
  safety = safety || 0;
  var country = person.birthCountry;

  if (safety > 20) {
    return nationality;
  }

  if (country == 'United States') {
    var parentPercentage = percentage / 2;
    for (var i = 0; i < 2; i++) {
      if (i < person.parents.length) {
        var thisPerson = person.parents[i];
        nationality = calculateNationality(thisPerson, people, nationality, parentPercentage,
          safety + 1);
      } else {
        nationality['unknown'] = nationality['unknown'] || 0;
        nationality['unknown'] += parentPercentage;
      }
    }
  } else {
    nationality[country] = nationality[country] || 0;
    nationality[country] += percentage;
  }

  return nationality;
}
