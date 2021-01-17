const {
  Citation,
  Notation,
  Person,
  Story,
  Tag,
  createController,
  getEditTableRows,
} = require('../import');

const notationTools = require('./tools');
module.exports = createRoutes;

function createRoutes(router) {
  router.param('id', notationTools.convertParamNotationId);

  router.use(notationTools.createRenderNotation);

  createController({
    Model: Notation,
    modelName: 'notation',
    router,
    routes: {
      index: notationsIndex,
      create: createNotation,
      show: showNotation,
      edit: editNotation,
    },
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
  const notation = req.notation;

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

  res.renderNotation('show', {citations, citationsByPerson});
}

async function editNotation(req, res) {
  const tableRows = await getEditTableRows({
    item: req.notation,
    rootPath: req.rootPath,
  });

  res.renderNotation('edit', {
    itemName: 'notation',
    tableRows,
  });
}
