const mongoose = require('mongoose');
const Person = mongoose.model('Person');
const Notation = mongoose.model('Notation');
const {getAllData, populatePeopleDates} = require('./tools');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/checklist', checklistIndex);
  router.get('/checklist/vitals', checklistVitals);
  router.get('/checklist/children', checklistChildren);
  router.get('/checklist/wikitree', checklistWikiTree);
  router.get('/checklist/findagrave', checklistFindAGrave);
  router.get('/checklist/sourceCensus', checklistSourceCensus);
  router.get('/checklist/profileSummary', checklistProfileSummary);
  router.get('/checklist/images', checklistImages);
  router.get('/checklist/custom', checklistCustom);
  router.post('/checklist/new', checklistCreateNotation);
}

function checklistIndex(req, res, next) {
  res.render('layout', {
    view: 'checklist/index',
    title: 'Checklist',
  });
}

function checklistChildren(req, res, next) {
  Person.find({}, (err, people) => {
    res.render('layout', {
      view: 'checklist/children',
      title: 'Checklist',
      people,
    });
  });
}

function checklistVitals(req, res, next) {
  getAllData(data => {
    data.people = populatePeopleDates(data.people, data.events);

    data.personRef = {};
    data.people.forEach(person => data.personRef['' + person._id] = person);

    const anna = data.people.filter(person => person.name == 'Anna Peterson')[0];
    anna.connection = 'start';
    anna.degree = 1;
    findAncestors(anna, 2);

    function findAncestors(person, degree) {
      (person.parents || []).forEach(parentId => {
        const parent = data.personRef['' + parentId];
        parent.connection = 'ancestor';
        parent.degree = degree;
        findAncestors(parent, degree + 1);
        findDescendants(parent, degree + 1);
      });
    }

    function findDescendants(person, degree) {
      (person.children || []).forEach(childId => {
        const child = data.personRef['' + childId];
        child.connection = child.connection || 'cousin';
        child.degree = child.degree || degree;
        findDescendants(child, degree + 1);
      });
    }

    const connOrder = ['cousin', 'ancestor', 'start'];
    data.people.sort((a, b) => {
      // order by connection type, then by degree of separation
      let swap = connOrder.indexOf(b.connection) - connOrder.indexOf(a.connection);
      return swap == 0 ? (a.degree || 100) - (b.degree || 100) : swap;
    });

    res.render('layout', {
      view: 'checklist/vitals',
      title: 'Checklist',
      ...data
    });
  });
}

function checklistWikiTree(req, res, next) {
  mongoose.model('Person').find({}, (err, people) => {
    res.render('layout', {
      view: 'checklist/personLinks',
      title: 'Checklist',
      people,
      linkType: 'WikiTree',
    });
  });
}

function checklistFindAGrave(req, res, next) {
  mongoose.model('Person').find({}, (err, people) => {
    res.render('layout', {
      view: 'checklist/personLinks',
      title: 'Checklist',
      people,
      linkType: 'FindAGrave',
    });
  });
}

function checklistSourceCensus(req, res, next) {
  mongoose.model('Source').find({}).populate('story').exec((err, sources) => {
    mongoose.model('Notation').find({title: 'source citation'}).exec((err, notations) => {
      const censusSources = sources.filter(source => {
        return source.story.title.match('Census USA');
      });

      const notationRef = {};
      notations.forEach(notation => {
        if (notation.source) {
          notationRef['' + notation.source] = true;
        }
      });

      censusSources.forEach(source => {
        source.hasAncestry = source.links.some(link => link.match(' Ancestry'));
        source.hasFamilySearch = source.links.some(link => link.match(' FamilySearch'));
        source.hasCitation = !!notationRef['' + source._id];
        source.sort = (source.sharing ? '1' : '2')
          + (source.hasAncestry || source.hasFamilySearch ? '2' : '1')
          + (source.hasAncestry ? '2' : '1')
          + (source.hasFamilySearch ? '2' : '1');
      });

      censusSources.sort((a, b) => a.sort < b.sort ? -1 : 1);

      res.render('layout', {
        view: 'checklist/sourceCensus',
        title: 'Checklist',
        censusSources,
      });
    });
  });
}

function checklistImages(req, res, next) {
  let images = [];

  new Promise(resolve => {
    mongoose.model('Source').find({})
    .populate('story')
    .populate('images')
    .exec((err, sources) => {
      sources.forEach(source => {
        source.images.forEach(image => {
          image.source = source;
          images.push(image);
        });
      });
      resolve();
    });
  }).then(() => {
    return new Promise(resolve => {
      mongoose.model('Story').find({})
      .populate('images')
      .exec((err, stories) => {
        stories.forEach(story => {
          story.images.forEach(image => {
            image.story = story;
            images.push(image);
          });
        });
        resolve();
      });
    });
  }).then(() => {
    images.sort((a, b) => {
      if (a.tags.length == b.tags.length) {
        let sortA = a.tags.sort().join('-');
        let sortB = b.tags.sort().join('-');
        if (sortA == sortB) {
          return 0;
        }
        return sortB < sortA ? -1 : 1;
      }
      return b.tags.length - a.tags.length;
    });

    res.render('layout', {
      view: 'checklist/images',
      title: 'Checklist',
      images,
    });
  });
}

function checklistProfileSummary(req, res, next) {
  mongoose.model('Person').find({}).exec((err, people) => {
    mongoose.model('Notation').find({}).exec((err, notations) => {
      mongoose.model('Source').find({ tags: 'biography'}).exec((err, sources) => {
        const personNotations = {};
        const personBiographies = {};

        sources.forEach(source => {
          const person = source.people[0];
          personBiographies['' + person] = personBiographies['' + person] || [];
          personBiographies['' + person].push(source);
        });

        notations = notations.filter(notation => {
          return notation.title == 'profile summary'
            || notation.tags.includes('profile summary');
        }).forEach(notation => {
          notation.also = notation.tags.filter(tag => {
            return tag.match('brick wall') || tag == 'research notes';
          });
          notation.people.forEach(person => {
            personNotations['' + person] = personNotations['' + person] || [];
            personNotations['' + person].push(notation);
          });
        });

        const peopleNeedSummary = people.filter(person => {
          return person.tags.includes('need profile summary')
            || person.tags.includes('needs profile summary');
        });

        const peopleWithSummary = [];
        const peopleWithBiography = [];
        const peopleWithoutSummaryShared = [];
        const peopleWithoutSummaryNotShared = [];

        people.forEach(person => {
          person.notations = personNotations['' + person._id];
          person.biographies = personBiographies['' + person._id];
          if (person.notations || person.biographies) {
            if (person.notations) {
              peopleWithSummary.push(person);
            } else {
              peopleWithBiography.push(person);
            }
          } else if (person.sharing.level == 2) {
            peopleWithoutSummaryShared.push(person);
          } else {
            peopleWithoutSummaryNotShared.push(person);
          }
        });

        res.render('layout', {
          view: 'checklist/profileSummary',
          title: 'Checklist',
          peopleNeedSummary,
          peopleWithSummary,
          peopleWithBiography,
          peopleWithoutSummaryShared,
          peopleWithoutSummaryNotShared,
        });
      });
    });
  });
}

async function checklistCustom(req, res) {
  const notations = await Notation.find({title: 'checklist'});
  res.render('layout', {
    view: 'checklist/custom',
    title: 'Checklist',
    notations
  });
}

async function checklistCreateNotation(req, res) {
  const notation = await Notation.create({
    title: 'checklist',
    text: req.body.text.trim()
  });
  res.redirect('/checklist/custom');
}
