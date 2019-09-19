const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const Person = mongoose.model('Person');
const getTools = (path) => { return require('../../tools/' + path) };
const createModelRoutes = getTools('createModelRoutes');
const personTools = require('./tools');
const sortEvents = getTools('sortEvents');
const sortCitations = getTools('sortCitations');
const sortSources = getTools('sortSources');
const removePersonFromList = getTools('removePersonFromList');
const getNewEventValues = getTools('getNewEventValues');
const getPersonRelativesList = getTools('getPersonRelativesList');
const reorderList = getTools('reorderList');

const personProfileRoutes = require('./profile');
const personTimeline = require('./timeline');
const personChecklist = require('./checklist');

personTools.convertParamPersonId(router);

createModelRoutes({
  Model: Person,
  modelName: 'person',
  modelNamePlural: 'people',
  router: router,
  index: peopleIndex(false),
  new: peopleIndex(true),
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
//   singleAttributes: ['title', 'content', 'notes', 'summary',
//     'date', 'location', 'story'],
//   listAttributes: ['people', 'links', 'images', 'tags', 'stories'],
});

router.post('/person/:id/edit/name', makeRouteEditPost('name'));
router.post('/person/:id/edit/id', makeRouteEditPost('customId'));
router.post('/person/:id/edit/profileImage', makeRouteEditPost('profileImage'));
router.post('/person/:id/edit/shareName', makeRouteEditPost('shareName'));
router.post('/person/:id/edit/gender', makeRouteEditPost('gender'));
router.post('/person/:id/add/links', makeRouteEditPost('links'));
router.post('/person/:id/delete/links/:deleteId', makeRouteDelete('links'));
router.post('/person/:id/reorder/links/:orderId', makeRouteReorder('links'));
router.post('/person/:id/add/tags', makeRouteEditPost('tags'));
router.post('/person/:id/delete/tags/:deleteId', makeRouteDelete('tags'));
router.post('/person/:id/reorder/tags/:orderId', makeRouteReorder('tags'));
router.post('/person/:id/add/events', makeRouteEditPost('events'));
router.post('/person/:id/add/notations', createPersonNotation);

createRelationshipRoutes('parents', 'children');
createRelationshipRoutes('spouses', 'spouses');
createRelationshipRoutes('children', 'parents');

function peopleIndex(showNew) {
  return function(req, res, next) {
    Person.find({}, (error, people) => {
      if (error) {
        return console.error(error);
      }
      res.render('layout', {
        view: 'people/index',
        title: 'All People',
        people: people,
        showNew: showNew,
      });
    });
  };
}

function createRelationshipRoutes(relationship, corresponding) {
  const addPath = '/person/:id/add/' + relationship;
  const deletePath = '/person/:id/delete/' + relationship + '/:deleteId';
  const reorderPath = '/person/:id/reorder/' + relationship + '/:orderId';

  router.post(addPath, makeRouteEditPost(relationship, corresponding));
  router.post(deletePath, makeRouteDelete(relationship, corresponding));
  router.post(reorderPath, makeRouteReorder(relationship));
}

function createPerson(req, res, next) {
  const newPerson = {
    name: req.body.name,
    customId: req.body.name,
    gender: req.body.gender,
  };

  if (newPerson.name.trim() == '') {
    return;
  }

  while (newPerson.customId.match(' ')) {
    newPerson.customId = newPerson.customId.replace(' ', '');
  }

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
    } else if (['links', 'tags'].includes(editField)) {
      if (newValue != '') {
        updatedObj[editField] = (person[editField] || []).concat(newValue);
      }
    } else if (editField == 'shareName') {
      updatedObj.sharing = person.sharing;
      updatedObj.sharing.name = newValue;
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

function makeRouteTogglePost(editField) {
  return function(req, res) {
    let person = req.person;
    let updatedObj = {};

    if (editField == 'shareLevel') {
      updatedObj.sharing = person.sharing;
      updatedObj.sharing.level += 1;
      if (updatedObj.sharing.level == 3) {
        updatedObj.sharing.level = 0;
      }
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
    } else if (['links', 'tags'].includes(editField)) {
      updatedObj[editField] = person[editField].filter((url, i) => {
        return i != deleteId;
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
