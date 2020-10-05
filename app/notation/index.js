const {
  Citation,
  Notation,
  Person,
  Story,
  Tag,
  createModelRoutes,
} = require('../import');

const constants = require('./constants');
module.exports = createRoutes;

function createRoutes(router) {
  createModelRoutes({
    Model: Notation,
    modelName: 'notation',
    router,
    index: notationsIndex,
    create: createNotation,
    show: showNotation,
    edit: editNotation,
    fields: constants.fields,
  });
}

async function notationsIndex(req, res) {
  const notations = await Notation.find({}).populate('tags');
  res.render('notation/index', {title: 'Notations', notations});
}

function createNotation(req, res) {
  const newNotation = Notation.getFormDataNew(req);
  if (!newNotation) {
    return res.send('error');
  }
  Notation.create(newNotation, (err, notation) => {
    if (err) {
      return res.send('There was a problem adding the information to the database.');
    }
    res.redirect('/notation/' + notation._id + '/edit');
  });
}

async function showNotation(req, res) {
  const notation = await getNotation(req.params.id);
  if (!notation) {
    return res.send('Notation not found.');
  }

  // If this notation is an excerpt from a source, show the source's citations
  // for the tagged people. The notation is probably an excerpt of the relevant
  // portion of the source for one person.
  let citations, citationsByPerson;
  if (notation.title === 'excerpt' && notation.people.length && notation.source) {
    await notation.source.populateCitations();

    citations = notation.source.citations.filter(citation => {
      return Person.findInList(notation.people, citation.person);
    });
    citationsByPerson = [...citations];

    Citation.sortByItem(citations, notation.people);
    Citation.sortByPerson(citationsByPerson, notation.people);
  }

  res.render('notation/show', {title: 'Notation', notation, citations, citationsByPerson});
}

async function editNotation(req, res) {
  const notation = await getNotation(req.params.id);
  if (!notation) {
    return res.send('Notation not found.');
  }

  const people = await Person.find({});
  Person.sortByName(people);

  const stories = await Story.find({});

  const tags = await Tag.find({});
  Tag.sortByTitle(tags);

  res.render('notation/edit', {
    title: 'Notation',
    notation,
    people,
    stories,
    rootPath: '/notation/' + notation._id,
    fields: constants.fields,
    tags,
  });
}

async function getNotation(notationId) {
  const notation = await Notation
    .findById(notationId)
    .populate('source')
    .populate('people')
    .populate('stories')
    .populate('tags');

  if (notation && notation.source) {
    await notation.source.populateStory();
  }

  return notation;
}
