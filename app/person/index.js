const {
  Event,
  Notation,
  Person,
  createModelRoutes,
  reorderList,
} = require('../import');

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
    toggleAttributes: ['shareLevel'],
    singleAttributes: ['name', 'customId', 'profileImage', 'shareName',
      'gender'],
    listAttributes: ['links', 'tags'],
  });

  const personRelationships = [
    ['parents', 'children'],
    ['spouses', 'spouses'],
    ['children', 'parents']
  ];

  personRelationships.forEach(([relationship, corresponding]) => {
    const addPath = '/person/:id/add/' + relationship;
    const deletePath = '/person/:id/delete/' + relationship + '/:deleteId';
    const reorderPath = '/person/:id/reorder/' + relationship + '/:orderId';

    router.post(addPath, makeRouteEditPost(relationship, corresponding));
    router.post(deletePath, makeRouteDelete(relationship, corresponding));
    router.post(reorderPath, makeRouteReorder(relationship));
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

function makeRouteEditPost(relationship, corresponding) {
  return async (req, res) => {
    const person = req.person;
    const updatedObj = {};
    const newValue = req.body[relationship];
    const newPersonId = newValue;

    if (newPersonId != '0') {
      updatedObj[relationship] = (person[relationship] || []).concat(newPersonId);

      Person.findById(newPersonId, (err, relative) => {
        var updatedRelative = {};
        updatedRelative[corresponding] = relative[corresponding] || [];
        updatedRelative[corresponding].push(person.id);
        relative.update(updatedRelative, () => {});
      });
    }

    person.update(updatedObj, err => {
      if (err) {
        return res.send('There was a problem updating the information to the database: ' + err);
      }

      let redirectUrl = '/person/';

      if (relationship == 'customId') {
        redirectUrl += newValue;
      } else {
        redirectUrl += req.paramPersonId;
      }

      if (relationship == 'events') {
        redirectUrl += '/timeline';
      } else {
        redirectUrl += '/edit';
      }

      res.redirect(redirectUrl);
    });
  };
}

function makeRouteDelete(relationship, corresponding) {
  return function(req, res, next) {
    var person = req.person;
    var updatedObj = {};
    var deleteId = req.params.deleteId;
    var relationship = relationship;

    updatedObj[relationship] = Person.removeFromList(person[relationship], deleteId);

    Person.findById(deleteId, function(err, relative) {
      if (err) {
      } else {
        var updatedRelative = {};

        updatedRelative[corresponding] = Person.removeFromList(relative[corresponding], person);

        relative.update(updatedRelative, () => {});
      }
    });

    person.update(updatedObj, function(err) {
      if (err) {
        res.send('There was a problem updating the information to the database: ' + err);
      } else {
        res.format({
          html: function() {
            res.redirect('/person/' + req.paramPersonId + '/edit');
          }
        });
       }
    });
  };
}

function makeRouteReorder(relationship) {
  return async (req, res) => {
    const person = req.person;
    const updatedObj = {};
    const orderId = req.params.orderId;

    updatedObj[relationship] = reorderList(person[relationship], orderId, 'people');

    await person.update(updatedObj);

    res.redirect('/person/' + req.paramPersonId + '/edit');
  };
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
