const {
  Image, Notation, Person, Source, Story,
  sortBy,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.use(createRenderChecklist);

  router.get('/checklist', checklistIndex);
  router.get('/checklist/vitals', checklistVitals);
  router.get('/checklist/wikitree', checklistWikiTree);
  router.get('/checklist/findagrave', checklistFindAGrave);
  router.get('/checklist/sourceCensus', checklistSourceCensus);
  router.get('/checklist/profileSummary', checklistProfileSummary);
  router.get('/checklist/images', checklistImages);
  router.get('/checklist/custom', checklistCustom);
  router.post('/checklist/custom/new', checklistCreateCustom);
}

function createRenderChecklist(req, res, next) {
  res.renderChecklist = (view, options = {}) => {
    res.render('checklist/' + view, {
      title: 'Checklist',
      ...options
    });
  }
  next();
}

function checklistIndex(req, res) {
  res.renderChecklist('index');
}

async function checklistVitals(req, res) {
  const people = await Person.find({});
  const rootPerson = people.find(person => person.name === 'Anna Peterson');
  Person.populateConnections(people, rootPerson);
  await Person.populateBirthAndDeath(people);

  res.renderChecklist('vitals', {
    people,
    connectionTitle: [null, 'start', 'ancestor', 'cousin', 'marriage']
  });
}

async function checklistWikiTree(req, res) {
  const people = await Person.find({});
  res.renderChecklist('personLinks', {people, linkType: 'WikiTree'});
}

async function checklistFindAGrave(req, res) {
  const people = await Person.find({});
  res.renderChecklist('personLinks', {people, linkType: 'FindAGrave'});
}

async function checklistSourceCensus(req, res) {
  const stories = await Story.getAllCensusUSA();
  const censusSources = await Story.getAllEntries(stories);

  for (let i in censusSources) {
    const source = censusSources[i];
    const notation = await Notation.find({source, title: 'source citation'});

    source.hasAncestry = source.links.some(link => link.match(' Ancestry'));
    source.hasFamilySearch = source.links.some(link => link.match(' FamilySearch'));
    source.hasCitation = notation.length > 0;

    const hasEverything = source.hasAncestry && source.hasFamilySearch
      && source.hasCitation;

    source.sortBy = [
      !hasEverything,
      source.sharing,
      !source.hasAncestry || !source.hasFamilySearch,
      !source.hasAncestry,
      !source.hasFamilySearch
    ].map(test => test ? '1' : '2').join('');
  }

  sortBy(censusSources, source => source.sortBy);

  res.renderChecklist('sourceCensus', {censusSources});
}

async function checklistImages(req, res) {
  const images = await Image.getAllByParent();
  Image.sortByTags(images);
  res.renderChecklist('images', {images});
}

async function checklistProfileSummary(req, res) {
  const people = await Person.find({});
  const sources = await Source.find({tags: 'biography'});
  const notations1 = await Notation.find({title: 'profile summary'});
  const notations2 = await Notation.find({tags: 'profile summary'});
  const notations = [...notations1, ...notations2];

  const personNotations = {};
  const personBiographies = {};

  sources.forEach(source => {
    const person = source.people[0];
    personBiographies['' + person] = personBiographies['' + person] || [];
    personBiographies['' + person].push(source);
  });

  notations.forEach(notation => {
    notation.also = notation.tags.filter(tag => {
      return tag.match('brick wall') || tag == 'research notes';
    });
    notation.people.forEach(person => {
      personNotations['' + person] = personNotations['' + person] || [];
      personNotations['' + person].push(notation);
    });
  });

  const data = {
    peopleNeedSummary: [],
    peopleWithSummary: [],
    peopleWithBiography: [],
    peopleWithoutSummaryShared: [],
    peopleWithoutSummaryNotShared: [],
  };

  people.forEach(person => {
    person.notations = personNotations['' + person._id];
    person.biographies = personBiographies['' + person._id];

    if (person.tags.includes('need profile summary')) {
      data.peopleNeedSummary.push(person);
      return;
    }

    if (person.notations || person.biographies) { // could be both
      if (person.notations) {
        data.peopleWithSummary.push(person);
      }
      if (person.biographies) {
        data.peopleWithBiography.push(person);
      }
      return;
    }

    if (person.sharing.level == 2) {
      data.peopleWithoutSummaryShared.push(person);
    } else {
      data.peopleWithoutSummaryNotShared.push(person);
    }
  });

  res.renderChecklist('profileSummary', data);
}

async function checklistCustom(req, res) {
  const notations = await Notation.find({title: 'checklist'});
  res.renderChecklist('custom', {notations});
}

async function checklistCreateCustom(req, res) {
  const notation = await Notation.create({
    title: 'checklist',
    text: req.body.text.trim()
  });
  res.redirect('/checklist/custom');
}
