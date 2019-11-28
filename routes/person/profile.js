const mongoose = require('mongoose');
const Person = mongoose.model('Person');
const getTools = (path) => { return require('../../tools/' + path) };
const personTools = require('./tools');
const removePersonFromList = getTools('removePersonFromList');
const sortEvents = getTools('sortEvents');
const sortCitations = getTools('sortCitations');
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

function personSummary(req, res, next) {
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

    res.render('layout', {
      view: 'person/layout',
      subview: 'show',
      title: person.name,
      paramPersonId: req.paramPersonId,
      personId: req.personId,
      events: sortEvents(data.events),
      citations: sortCitations(data.citations, 'item'),
      findPersonInList: personTools.findPersonInList,
      person,
      people,
      siblings,
    });
  });
}

function personEdit(req, res, next) {
  Person
  .findById(req.personId)
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec((err, person) => {
    Person
    .find({})
    .exec((err, allPeople) => {
      var people = removePersonFromList(allPeople, person);
      people.sort((a, b) => a.name < b.name ? -1 : 1);
      res.render('layout', {
        view: 'person/layout',
        subview: 'edit',
        title: person.name,
        paramPersonId: req.paramPersonId,
        personId: req.personId,
        person: person,
        people: people,
      });
    });
  });
}

function personSources(req, res, next) {
  const person = req.person;
  mongoose.model('Source')
  .find({ people: person })
  .populate('story')
  .populate('images')
  .exec((err, sources) => {
    mongoose.model('Citation')
    .find({ person: person })
    .exec((err, citations) => {
      citations = sortCitations(citations, 'item');

      sources.sort((a, b) => {
        let sortA = a.story.type + ' - ' + a.story.title + ' - ' + a.title;
        let sortB = b.story.type + ' - ' + b.story.title + ' - ' + b.title;
        return sortA == sortB ? 0 : sortA > sortB ? 1 : -1;
      });

      res.render('layout', {
        view: 'person/layout',
        subview: 'sources',
        title: person.name,
        paramPersonId: req.paramPersonId,
        personId: req.personId,
        person: person,
        sources: sources,
        citations: citations,
      });
    });
  });
}

function personNotations(req, res, next) {
  const person = req.person;
  mongoose.model('Notation').find({ people: person }, (err, notations) => {
    res.render('layout', {
      view: 'person/layout',
      subview: 'notations',
      person: person,
      title: person.name,
      paramPersonId: req.paramPersonId,
      personId: req.personId,
      notations: notations,
    });
  });
}

function personNationality(req, res) {
  Person
  .find({})
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec(function(err, people) {
    mongoose.model('Event')
    .find({ title: 'birth' })
    .exec(function(err, birthEvents) {
      var birthCountries = mapPersonCountries(birthEvents);

      people = people.map((thisPerson) => {
        thisPerson.birthCountry = birthCountries[thisPerson._id] || 'unknown';
        return thisPerson;
      });

      var person = personTools.populateParents(req.personId, people);

      var nationality = calculateNationality(person, people);

      res.format({
        html: function() {
          res.render('layout', {
            view: 'person/layout',
            subview: 'nationality',
            title: person.name,
            paramPersonId: req.paramPersonId,
            personId: req.personId,
            person: person,
            people: people,
            nationality: nationality,
          });
        }
      });
    });
  });
}

function personRelatives(req, res) {
  Person
  .find({})
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec(function(err, people) {
    const person = personTools.findPersonInList(people, req.personId);
    const relativeList = getPersonRelativesList(people, person);
    res.render('layout', {
      view: 'person/layout',
      subview: 'relatives',
      title: person.name,
      paramPersonId: req.paramPersonId,
      person: person,
      people: people,
      relativeList: relativeList,
    });
  });
}

function personConnection(req, res) {
  Person
  .find({})
  .exec((err, people) => {
    const person = personTools.findPersonInList(people, req.personId);
    const compare = people.filter(thisPerson => {
      return thisPerson.name == 'Anna Peterson';
    })[0];

    res.render('layout', {
      view: 'person/layout',
      subview: 'connection',
      title: person.name,
      paramPersonId: req.paramPersonId,
      person: person,
      compare: compare,
      people: people,
      findPerson: person => {
        return personTools.findPersonInList(people, person)
      },
      isSamePerson: personTools.isSamePerson,
    });
  });
}

function personWikitree(req, res, next) {
  const person = req.person;

  mongoose.model('Source').find({ people: person }).populate('story').exec((err, sources) => {
    mongoose.model('Notation').find({ title: 'source citation' }, (err, notations) => {

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

      res.render('layout', {
        view: 'person/layout',
        subview: 'wikitree',
        title: person.name,
        personId: req.personId,
        paramPersonId: req.paramPersonId,
        person,
        sources,
      });
    });
  });
}

function mapPersonCountries(events) {
  const personBirthCountries = {};

  events.forEach((thisEvent) => {
    if (thisEvent.location && thisEvent.location.country) {
      thisEvent.people.forEach((thisPerson) => {
        personBirthCountries[thisPerson] = thisEvent.location.country;
      });
    }
  });

  return personBirthCountries;
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
