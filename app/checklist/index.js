const {
  Image,
  Notation,
  Person,
  Source,
  Story,
  Tag,
  sortBy,
} = require('../import');

const getChecklistPlacesInfo = require('./checklist.places');
const {getObituaryChecklistData} = require('./checklist.tools');
const checklistVitals = require('./checklist.vitals');

module.exports = createRoutes;

function createRoutes(router) {
  router.use(createRenderChecklist);

  router.get('/checklist', checklistIndex);
  router.get('/checklist/vitals', checklistVitals);
  router.get('/checklist/sourceCensus', checklistSourceCensus);
  router.get('/checklist/profileSummary', checklistProfileSummary);
  router.get('/checklist/personParentAges', checklistPersonParentAges);
  router.get('/checklist/images', checklistImages);
  router.get('/checklist/places', checklistPlaces);
  router.get('/checklist/custom', checklistCustom);
  router.get('/checklist/obituaries', renderChecklistObituaries);
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

async function checklistIndex(req, res) {
  const hasOwnChecklistTag = await Tag.findOne({title: 'has own checklist'});
  const storiesWithChecklist = await Story.find({tags: hasOwnChecklistTag});

  const checklistMetatag = await Tag.findOne({title: 'checklist'});
  const checklistTags = await Tag.find({tags: checklistMetatag});
  Tag.sortByTitle(checklistTags);

  res.renderChecklist('index', {checklistTags, storiesWithChecklist});
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

async function checklistPlaces(req, res) {
  const data = await getChecklistPlacesInfo(req);
  res.renderChecklist('places', data);
}

async function checklistProfileSummary(req, res) {
  const people = await Person.find({});

  const biographyTag = await Tag.find({title: 'biography'});
  const sources = await Source.find({tags: biographyTag});

  const profileSummaryTag = await Tag.find({title: 'profile summary'});
  const notations1 = await Notation.find({title: 'profile summary'})
    .populate('tags');
  const notations2 = await Notation.find({tags: profileSummaryTag})
    .populate('tags');
  const notations = [...notations1, ...notations2];

  const personNotations = {};
  const personBiographies = {};

  sources.forEach(source => {
    const person = source.people[0];
    personBiographies['' + person] = personBiographies['' + person] || [];
    personBiographies['' + person].push(source);
  });

  notations.forEach(notation => {
    notation.also = notation.getTagTitles().filter(tagTitle => {
      return tagTitle.match('brick wall') || tagTitle == 'research notes';
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

    if (person.hasTag('need profile summary')) {
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

    if (person.isPublic()) {
      data.peopleWithoutSummaryShared.push(person);
    } else {
      data.peopleWithoutSummaryNotShared.push(person);
    }
  });

  res.renderChecklist('profileSummary', data);
}

async function checklistPersonParentAges(req, res) {
  const allPeople = await Person.find();

  await Person.populateBirthAndDeath(allPeople);

  const tmp = [];

  // Don't bother populating parents directly because birth event
  // needs to be populated manually anyway.
  const peopleMap = Person.createMap(allPeople);

  const missingItems = {
    totalNum: allPeople.length,
    personBirthYear: 0,
    mother: 0,
    motherBirthYear: 0,
  };

  const people = [];

  const birthAges = [
    null,
    {youngestPerson: null, youngestAge: 30, oldestPerson: null, oldestAge: 0},
    {youngestPerson: null, youngestAge: 30, oldestPerson: null, oldestAge: 0},
  ];

  allPeople.forEach(person => {
    const personBirthYear = person.getBirthYear();

    if (!personBirthYear) {
      missingItems.personBirthYear += 1;
      return;
    }

    person.ageWhenChildrenBorn = [];

    person.children.forEach(childId => {
      const childBirthYear = peopleMap[childId].getBirthYear();
      if (childBirthYear) {
        person.ageWhenChildrenBorn.push(childBirthYear - personBirthYear);
      }
    });

    if (person.ageWhenChildrenBorn.length) {
      person.ageWhenChildrenBorn.sort();
      people.push(person);

      const youngest = person.ageWhenChildrenBorn[0];
      const oldest = person.ageWhenChildrenBorn[person.ageWhenChildrenBorn.length - 1];

      if (birthAges[person.gender].youngestAge > youngest) {
        birthAges[person.gender].youngestAge = youngest;
        birthAges[person.gender].youngestPerson = person;
      } else if (birthAges[person.gender].oldestAge < oldest) {
        birthAges[person.gender].oldestAge = oldest;
        birthAges[person.gender].oldestPerson = person;
      }
    }
  });

  res.renderChecklist('personParentAges', {birthAges, people});
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

async function renderChecklistObituaries(req, res) {
  const data = await getObituaryChecklistData();
  res.renderChecklist('obituaries', data);
}
