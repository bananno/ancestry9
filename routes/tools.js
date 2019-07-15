const mongoose = require('mongoose');
const tools = {};

module.exports = tools;

function isPersonInList(list, person) {
  let personId = '' + (person._id || person);
  return list.map(person => '' + person._id || person).includes(personId);
}
tools.isPersonInList = isPersonInList;

tools.getAllData = (callback) => {
  new Promise(resolve => {
    mongoose.model('Person').find({}).exec((err, people) => {
      const data = {};
      data.people = people;
      resolve(data);
    });
  }).then(data => {
    return new Promise(resolve => {
      mongoose.model('Source').find({}).populate('people')
      .exec((err, sources) => {
        data.sources = sources;
        resolve(data);
      });
    });
  }).then(data => {
    return new Promise(resolve => {
      mongoose.model('Event').find({})//.populate('people')
      .exec((err, events) => {
        data.events = events;
        resolve(data);
      });
    });
  }).then(data => {
    return new Promise(resolve => {
      mongoose.model('Citation').find({}).populate('person').populate('source')
      .exec((err, citations) => {
        data.citations = citations;
        resolve(data);
      });
    });
  }).then(callback);
};

tools.populatePeopleDates = (people, events) => {
  return people.map(person => {
    person.birth = events.filter(event => {
      return isPersonInList(event.people, person)
        && ['birth', 'birth and death'].includes(event.title);
    })[0];

    person.death = events.filter(event => {
      return isPersonInList(event.people, person)
        && ['death', 'birth and death'].includes(event.title);
    })[0];

    return person;
  });
};
