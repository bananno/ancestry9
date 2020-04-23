const {
  Event,
  Notation,
  Person,
  createModelRoutes,
  reorderList,
} = require('../import');

const constants = require('./constants');
const personTools = require('./tools');
const personProfileRoutes = require('./profile');
const personTimeline = require('./timeline');
const personChecklist = require('./checklist');

module.exports = createRoutes;

function createRoutes(router) {
  router.param('id', personTools.convertParamPersonId1);
  router.param('personId', personTools.convertParamPersonId2);
  router.use(personTools.createRenderPersonProfile);

  createModelRoutes({
    Model: Person,
    modelName: 'person',
    modelNamePlural: 'people',
    router,
    index: peopleIndex,
    create: createPerson,
    show: personProfileRoutes.show,
    edit: personProfileRoutes.edit,
    delete: null,
    otherRoutes: {
      timeline: personTimeline,
      checklist: personChecklist,
      ...personProfileRoutes.other,
    },
    fields: constants.fields,
  });

  router.post('/person/:id/add/events', createPersonEvent);
  router.post('/person/:id/add/notations', createPersonNotation);
}

async function peopleIndex(req, res) {
  const people = await Person.find({});
  res.render('person/index', {title: 'All People', people});
}

function createPerson(req, res) {
  const newPerson = Person.getFormDataNew(req);

  if (!newPerson) {
    return res.send('error');
  }

  Person.create(newPerson, function(err, person) {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    } else {
      res.redirect('/person/' + person.customId + '/edit');
    }
  });
}

async function createPersonEvent(req, res) {
  const newEvent = Event.getFormDataNew(req);

  if (!newEvent) {
    return res.send('error');
  }

  newEvent.people.push(req.person);

  await Event.create(newEvent);

  res.redirect('/person/' + req.paramPersonId + '/timeline');
}

async function createPersonNotation(req, res) {
  const newNotation = Notation.getFormDataNew(req);

  if (!newNotation) {
    return res.send('error');
  }

  newNotation.people.push(req.person);

  await Notation.create(newNotation);

  res.redirect('/person/' + req.paramPersonId + '/notations');
}
