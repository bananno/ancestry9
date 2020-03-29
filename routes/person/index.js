const mongoose = require('mongoose');
const Person = mongoose.model('Person');
const tool = path => require('../../tools/' + path);
const createModelRoutes = tool('createModelRoutes');
const personTools = require('./tools');
const removePersonFromList = tool('removePersonFromList');
const getNewEventValues = tool('getNewEventValues');
const reorderList = tool('reorderList');
const personProfileRoutes = require('./profile');
const personTimeline = require('./timeline');
const personChecklist = require('./checklist');

module.exports = createRoutes;

function createRoutes(router) {
  router.param('id', personTools.convertParamPersonId);
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

  router.post('/person/:id/add/events', makeRouteEditPost('events'));
  router.post('/person/:id/add/notations', createPersonNotation);

  createRelationshipRoutes(router, 'parents', 'children');
  createRelationshipRoutes(router, 'spouses', 'spouses');
  createRelationshipRoutes(router, 'children', 'parents');
}

async function peopleIndex(req, res) {
  const people = await Person.find({});
  res.render('people/index', {title: 'All People', people});
}

function createRelationshipRoutes(router, relationship, corresponding) {
  const addPath = '/person/:id/add/' + relationship;
  const deletePath = '/person/:id/delete/' + relationship + '/:deleteId';
  const reorderPath = '/person/:id/reorder/' + relationship + '/:orderId';

  router.post(addPath, makeRouteEditPost(relationship, corresponding));
  router.post(deletePath, makeRouteDelete(relationship, corresponding));
  router.post(reorderPath, makeRouteReorder(relationship));
}

function createPerson(req, res, next) {
  const newPerson = {
    name: req.body.name.trim(),
    gender: req.body.gender,
  };

  if (newPerson.name == '') {
    return;
  }

  newPerson.customId = newPerson.name
    .toLowerCase()
    .replace(/\[|\]|\(|\)|\.|\//g, '')
    .replace(/ /g, '-');

  mongoose.model('Person').create(newPerson, function(err, person) {
    if (err) {
      res.send('There was a problem adding the information to the database.');
    } else {
      res.format({
        html: function() {
          res.redirect('/person/' + person.customId + '/edit');
        }
      });
    }
  });
}

function makeRouteEditPost(editField, corresponding) {
  return (req, res) => {
    const person = req.person;
    const updatedObj = {};
    const newValue = req.body[editField];

    if (corresponding) {
      var newPersonId = newValue;

      if (newPersonId != '0') {
        updatedObj[editField] = (person[editField] || []).concat(newPersonId);

        Person.findById(newPersonId, (err, relative) => {
          var updatedRelative = {};
          updatedRelative[corresponding] = relative[corresponding] || [];
          updatedRelative[corresponding].push(person.id);
          relative.update(updatedRelative, () => {});
        });
      }
    } else if (editField == 'events') {
      var newEvent = getNewEventValues(req);

      if (newEvent == null) {
        return;
      }

      newEvent.people.push(person);

      mongoose.model('Event').create(newEvent, () => {});
    } else {
      updatedObj[editField] = newValue;
    }

    person.update(updatedObj, err => {
      if (err) {
        return res.send('There was a problem updating the information to the database: ' + err);
      }

      let redirectUrl = '/person/';

      if (editField == 'customId') {
        redirectUrl += newValue;
      } else {
        redirectUrl += req.paramPersonId;
      }

      if (editField == 'events') {
        redirectUrl += '/timeline';
      } else {
        redirectUrl += '/edit';
      }

      res.redirect(redirectUrl);
    });
  };
}

function makeRouteDelete(editField, corresponding) {
  return function(req, res, next) {
    var person = req.person;
    var updatedObj = {};
    var deleteId = req.params.deleteId;

    if (corresponding) {
      var relationship = editField;

      updatedObj[relationship] = removePersonFromList(person[relationship], deleteId);

      Person.findById(deleteId, function(err, relative) {
        if (err) {
        } else {
          var updatedRelative = {};

          updatedRelative[corresponding] = removePersonFromList(relative[corresponding], person.id);

          relative.update(updatedRelative, () => {});
        }
      });
    }

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

function makeRouteReorder(editField) {
  return function(req, res) {
    var person = req.person;
    var updatedObj = {};
    var orderId = req.params.orderId;
    var dataType = editField;

    if (editField == 'parents' || editField == 'spouses' || editField == 'children') {
      dataType = 'people';
    }

    updatedObj[editField] = reorderList(person[editField], orderId, dataType);

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

function createPersonNotation(req, res, next) {
  const person = req.person;
  const newNotation = {
    title: req.body.title.trim(),
    text: req.body.text.trim(),
    people: [person],
  };
  const tags = req.body.tags.trim();
  if (tags) {
    newNotation.tags = tags.split('\n');
  }
  mongoose.model('Notation').create(newNotation, (err, notation) => {
    res.redirect('/person/' + req.paramPersonId + '/notations');
  });
}
