const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const personTools = require('./tools');
const sortEvents = require('../../tools/sortEvents');
const sortCitations = require('../../tools/sortCitations');
const sortSources = require('../../tools/sortSources');
const removePersonFromList = require('../../tools/removePersonFromList');
const getNewEventValues = require('../../tools/getNewEventValues');
const getPersonRelativesList = require('../../tools/getPersonRelativesList');
const reorderList = require('../../tools/reorderList');

personTools.convertParamPersonId(router);

router.get('/person/:personId', personSummary);
router.get('/person/:personId/edit', personEdit);
router.get('/person/:personId/sources', personSources);
router.get('/person/:personId/nationality', personNationality);
router.get('/person/:personId/relatives', personRelatives);
router.get('/person/:personId/connection', personConnection);

router.post('/person/:personId/edit/name', makeRouteEditPost('name'));
router.post('/person/:personId/edit/id', makeRouteEditPost('customId'));
router.post('/person/:personId/edit/profileImage', makeRouteEditPost('profileImage'));
router.post('/person/:personId/edit/shareName', makeRouteEditPost('shareName'));
router.post('/person/:personId/add/links', makeRouteEditPost('links'));
router.post('/person/:personId/delete/links/:deleteId', makeRouteDelete('links'));
router.post('/person/:personId/reorder/links/:orderId', makeRouteReorder('links'));
router.post('/person/:personId/add/tags', makeRouteEditPost('tags'));
router.post('/person/:personId/delete/tags/:deleteId', makeRouteDelete('tags'));
router.post('/person/:personId/reorder/tags/:orderId', makeRouteReorder('tags'));
router.post('/person/:personId/add/events', makeRouteEditPost('events'));
router.post('/person/:personId/toggle/shareLevel', makeRouteTogglePost('shareLevel'));

createRelationshipRoutes('parents', 'children');
createRelationshipRoutes('spouses', 'spouses');
createRelationshipRoutes('children', 'parents');

module.exports = router;

function createRelationshipRoutes(relationship, corresponding) {
  const addPath = '/person/:personId/add/' + relationship;
  const deletePath = '/person/:personId/delete/' + relationship + '/:deleteId';
  const reorderPath = '/person/:personId/reorder/' + relationship + '/:orderId';

  router.post(addPath, makeRouteEditPost(relationship, corresponding));
  router.post(deletePath, makeRouteDelete(relationship, corresponding));
  router.post(reorderPath, makeRouteReorder(relationship));
}

function collectData(list, callback) {
  dataHelper({}, list[0]).then(data => {
    return dataHelper(data, list[1]);
  }).then(data => {
    return dataHelper(data, list[2]);
  }).then(callback);

  function dataHelper(data, obj) {
    const method = obj.method || 'find';
    const finder = method == 'findById' ? obj.id : obj.getFinder(data);

    return new Promise(resolve => {
      mongoose.model(obj.model)[method](finder, (err, result) => {
        data[obj.name] = result;
        resolve(data);
      });
    });
  }
}

function personSummary(req, res, next) {
  mongoose.model('Person').findById(req.personId)
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec(function(err, person) {
    mongoose.model('Person')
    .find({})
    .exec(function(err, allPeople) {
      mongoose.model('Event')
      .find({ people: person })
      .populate('people')
      .exec(function(err, events) {
        mongoose.model('Citation')
        .find({ person: person })
        .populate('source')
        .exec(function(err, citations) {

          var people = removePersonFromList(allPeople, person);

          var siblings = [];

          if (person.parents.length > 0) {
            siblings = people.filter(function(thisPerson) {
              for (var i = 0; i < thisPerson.parents.length; i++) {
                var thisParent1 = thisPerson.parents[i];
                for (var j = 0; j < person.parents.length; j++) {
                  var thisParent2 = person.parents[j];
                  if (thisParent1 == thisParent2.id) {
                    return true;
                  }
                }
              }
              return false;
            });
          }

          events = sortEvents(events);
          citations = sortCitations(citations, 'item');

          res.render('layout', {
            view: 'person/layout',
            subview: 'show',
            title: person.name,
            paramPersonId: req.paramPersonId,
            personId: req.personId,
            person: person,
            people: people,
            siblings: siblings,
            events: events,
            citations: citations,
          });
        });
      });
    });
  });
}

function personEdit(req, res, next) {
  mongoose.model('Person')
  .findById(req.personId)
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec((err, person) => {
    mongoose.model('Person')
    .find({})
    .exec((err, allPeople) => {
      var people = removePersonFromList(allPeople, person);
      res.render('layout', {
        view: 'person/layout',
        subview: 'edit',
        title: person.name,
        paramPersonId: req.paramPersonId,
        personId: req.personId,
        person: person,
        people: people,
      });
    });
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

        mongoose.model('Person').findById(newPersonId, (err, relative) => {
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

      mongoose.model('Person').findById(deleteId, function(err, relative) {
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

function personSources(req, res, next) {
  collectData([
    {
      model: 'Person',
      name: 'person',
      method: 'findById',
      id: req.personId
    },
    {
      model: 'Source',
      name: 'sources',
      getFinder: data => {
        return { people: data.person };
      }
    },
    {
      model: 'Citation',
      name: 'citations',
      getFinder: data => {
        return { person: data.person };
      }
    },
  ], data => {
    data.citations = sortCitations(data.citations, 'item');
    data.sources.sort((a, b) => {
      let sortA = a.type + ' - ' + a.group + ' - ' + a.title;
      let sortB = b.type + ' - ' + b.group + ' - ' + b.title;
      return sortA == sortB ? 0 : sortA > sortB ? 1 : -1;
    });

    res.render('layout', {...data,
      view: 'person/layout',
      subview: 'sources',
      title: data.person.name,
      paramPersonId: req.paramPersonId,
      personId: req.personId,
    });
  });
}

function personNationality(req, res) {
  mongoose.model('Person')
  .find({})
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec(function(err, people) {
    mongoose.model('Event')
    .find({ title: 'birth' })
    .exec(function(err, birthEvents) {
      var birthCountries = mapPersonCountries(birthEvents);

      people = people.map((thisPerson) => {
        thisPerson.birthCountry = birthCountries[thisPerson._id] || 'unknown';
        return thisPerson;
      });

      var person = personTools.populateParents(req.personId, people);

      var nationality = calculateNationality(person, people);

      res.format({
        html: function() {
          res.render('layout', {
            view: 'person/layout',
            subview: 'nationality',
            title: person.name,
            paramPersonId: req.paramPersonId,
            personId: req.personId,
            person: person,
            people: people,
            nationality: nationality,
          });
        }
      });
    });
  });
}

function personRelatives(req, res) {
  mongoose.model('Person')
  .find({})
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec(function(err, people) {
    const person = personTools.findPersonInList(people, req.personId);
    const relativeList = getPersonRelativesList(people, person);
    res.render('layout', {
      view: 'person/layout',
      subview: 'relatives',
      title: person.name,
      paramPersonId: req.paramPersonId,
      person: person,
      people: people,
      relativeList: relativeList,
    });
  });
}

function personConnection(req, res) {
  mongoose.model('Person')
  .find({})
  .exec((err, people) => {
    const person = personTools.findPersonInList(people, req.personId);
    const compare = people.filter(thisPerson => {
      return thisPerson.name == 'Anna Peterson';
    })[0];

    res.render('layout', {
      view: 'person/layout',
      subview: 'connection',
      title: person.name,
      paramPersonId: req.paramPersonId,
      person: person,
      compare: compare,
      people: people,
      findPerson: person => {
        return personTools.findPersonInList(people, person)
      },
      isSamePerson: personTools.isSamePerson,
    });
  });
}

// HELPER

function mapPersonCountries(events) {
  var personBirthCountries = {};

  events.forEach((thisEvent) => {
    if (thisEvent.location && thisEvent.location.country) {
      thisEvent.people.forEach((thisPerson) => {
        personBirthCountries[thisPerson] = thisEvent.location.country;
      });
    }
  });

  return personBirthCountries;
}

function calculateNationality(person, people, nationality, percentage, safety) {
  nationality = nationality || {};
  percentage = percentage || 100;
  safety = safety || 0;
  var country = person.birthCountry;

  if (safety > 20) {
    return nationality;
  }

  if (country == 'United States') {
    var parentPercentage = percentage / 2;
    for (var i = 0; i < 2; i++) {
      if (i < person.parents.length) {
        var thisPerson = person.parents[i];
        nationality = calculateNationality(thisPerson, people, nationality, parentPercentage,
          safety + 1);
      } else {
        nationality['unknown'] = nationality['unknown'] || 0;
        nationality['unknown'] += parentPercentage;
      }
    }
  } else {
    nationality[country] = nationality[country] || 0;
    nationality[country] += percentage;
  }

  return nationality;
}
