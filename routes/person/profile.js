const {
  Citation,
  Event,
  Notation,
  Person,
  removePersonFromList,
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

function personSummary(req, res) {
  const data = {};
  new Promise(resolve => {
    Person.findById(req.personId)
    .populate('parents')
    .populate('spouses')
    .populate('children')
    .exec((err, person) => {
      data.person = person;
      resolve();
    });
  }).then(() => {
    return new Promise(resolve => {
      Person.find({}, (err, allPeople) => {
        data.people = removePersonFromList(allPeople, data.person);
        resolve();
      });
    });
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Event')
      .find({ people: data.person })
      .populate('people')
      .exec((err, events) => {
        data.events = events;
        resolve();
      });
    });
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Citation')
      .find({ person: data.person })
      .populate('source')
      .exec((err, citations) => {
        data.citations = citations;
        resolve();
      });
    });
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Story').find({}, (err, allStories) => {
        const storyRef = {};

        allStories.forEach(story => storyRef['' + story._id] = story);

        data.citations.forEach(citation => {
          if (!citation.source.story.title) {
            citation.source.story = storyRef['' + citation.source.story];
          }
        });

        resolve();
      });
    });
  }).then(() => {
    const people = data.people;
    const person = data.person;

    let siblings = [];

    if (person.parents.length > 0) {
      siblings = people.filter(thisPerson => {
        for (let i = 0; i < thisPerson.parents.length; i++) {
          let thisParent1 = thisPerson.parents[i];
          for (let j = 0; j < person.parents.length; j++) {
            let thisParent2 = person.parents[j];
            if (thisParent1 == thisParent2.id) {
              return true;
            }
          }
        }
        return false;
      });
    }

    renderPersonProfile(req, res, 'summary', {
      events: sortEvents(data.events),
      citations: sortCitations(data.citations, 'item'),
      findPersonInList: Person.findInList,
      person,
      people,
      siblings,
    });
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
      const people = removePersonFromList(allPeople, person);
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

  res.renderPersonProfile('nationality', {people, nationality});
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

function personWikitree(req, res) {
  const person = req.person;

  Source.find({ people: person }).populate('story').exec((err, sources) => {
    Notation.find({ title: 'source citation' }, (err, notations) => {

      sources.forEach(source => {
        const sourceNotations = notations.filter(notation => {
          return '' + notation.source == '' + source._id;
        }).map(notation => notation.text);

        const storyNotations = notations.filter(notation => {
          return notation.stories.includes('' + source.story._id);
        }).map(notation => notation.text);

        source.notations = [...sourceNotations, ...storyNotations];
      });

      sources = sources.filter(source => {
        return source.notations.length
          || source.story.title.match('Census USA');
      });

      sources.sort((a, b) => a.story.title < b.story.title ? -1 : 1);

      res.renderPersonProfile('wikitree', {sources});
    });
  });
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
