var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var sortEvents = require('../tools/sortEvents');
var sortCitations = require('../tools/sortCitations');
var sortSources = require('../tools/sortSources');
var removePersonFromList = require('../tools/removePersonFromList');
var getNewEventValues = require('../tools/getNewEventValues');
var getPersonRelativesList = require('../tools/getPersonRelativesList');
var reorderList = require('../tools/reorderList');

convertParamPersonId();

router.get('/:personId', personSummary);
router.get('/:personId/edit', personEdit);
router.get('/:personId/timeline', personTimeline);
router.get('/:personId/sources', personSources);
router.get('/:personId/nationality', personNationality);
router.get('/:personId/relatives', personRelatives);
router.get('/:personId/connection', personConnection);
router.get('/:personId/checklist', personChecklist);

router.post('/:personId/edit/name', makeRouteEditPost('name'));
router.post('/:personId/edit/id', makeRouteEditPost('customId'));
router.post('/:personId/edit/shareName', makeRouteEditPost('shareName'));
router.post('/:personId/add/links', makeRouteEditPost('links'));
router.post('/:personId/delete/links/:deleteId', makeRouteDelete('links'));
router.post('/:personId/reorder/links/:orderId', makeRouteReorder('links'));
router.post('/:personId/add/events', makeRouteEditPost('events'));
router.post('/:personId/toggle/shareLevel', makeRouteTogglePost('shareLevel'));

createRelationshipRoutes('parents', 'children');
createRelationshipRoutes('spouses', 'spouses');
createRelationshipRoutes('children', 'parents');

module.exports = router;

function createRelationshipRoutes(relationship, corresponding) {
  var addPath = '/:personId/add/' + relationship;
  var deletePath = '/:personId/delete/' + relationship + '/:deleteId';
  var reorderPath = '/:personId/reorder/' + relationship + '/:orderId';

  router.post(addPath, makeRouteEditPost(relationship, corresponding));
  router.post(deletePath, makeRouteDelete(relationship, corresponding));
  router.post(reorderPath, makeRouteReorder(relationship));
}

function convertParamPersonId() {
  router.param('personId', function(req, res, next, paramPersonId) {
    req.paramPersonId = paramPersonId;
    mongoose.model('Person').findById(paramPersonId, function (err, person) {
      if (err || person == null) {
        mongoose.model('Person').find({}, function (err, people) {
          var personWithId = people.filter(function(thisPerson) {
            return thisPerson.customId == paramPersonId
              || ('' + thisPerson._id) == ('' + paramPersonId);
          });
          if (personWithId.length == 0) {
            console.log('Person with ID "' + paramPersonId + '" was not found.');
            res.status(404);
            res.render('layout', {
              view: 'people/notFound',
              title: 'Not Found',
              personId: paramPersonId,
            });
          } else if (personWithId.length > 1) {
            console.log('Found more than one person with ID "' + paramPersonId + '".');
            res.render('people/duplicateIDs', {
              personId: paramPersonId,
              people: personWithId
            });
          } else {
            req.personId = personWithId[0]._id;
            req.person = personWithId[0];
            next();
          }
        });
      } else {
        req.personId = paramPersonId;
        req.person = person;
        next();
      }
    });
  });
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
  return function(req, res) {
    var person = req.person;
    var updatedObj = {};
    var newValue = req.body[editField];

    if (corresponding) {
      var newPersonId = newValue;

      if (newPersonId != '0') {
        updatedObj[editField] = (person[editField] || []).concat(newPersonId);

        mongoose.model('Person').findById(newPersonId, function(err, relative) {
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

      mongoose.model('Event').create(newEvent, function() {});
    } else if (editField == 'links') {
      if (newValue != '') {
        updatedObj[editField] = (person[editField] || []).concat(newValue);
      }
    } else if (editField == 'shareName') {
      updatedObj.sharing = person.sharing;
      updatedObj.sharing.name = newValue;
    } else {
      updatedObj[editField] = newValue;
    }

    person.update(updatedObj, function(err) {
      if (err) {
        res.send('There was a problem updating the information to the database: ' + err);
      } else {
        var redirectUrl = '/person/';

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

        res.format({
          html: function() {
            res.redirect(redirectUrl);
          }
        });
       }
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
    } else if (editField == 'links') {
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

function personTimeline(req, res, next) {
  mongoose.model('Person')
  .findById(req.personId)
  .exec(function(err, person) {
    mongoose.model('Event')
    .find({ })
    .populate('people')
    .exec(function(err, events) {
      mongoose.model('Source')
      .find({ people: person })
      .populate('people')
      .exec(function(err, sources) {
        var sourceEvents = getSourceEvents(sources);
        events = sortEvents(events);
        events = filterEvents(events, person);
        events = events.concat(sourceEvents);
        events = sortEvents(events);
        res.render('layout', {
          view: 'person/layout',
          subview: 'timeline',
          title: person.name,
          paramPersonId: req.paramPersonId,
          personId: req.personId,
          person: person,
          events: events,
        });
      });
    });
  });
}

function personSources(req, res, ntext) {
  mongoose.model('Person')
  .findById(req.personId)
  .exec(function(err, person) {
    mongoose.model('Source')
    .find({ people: person })
    .exec(function(err, sources) {
      mongoose.model('Citation')
      .find({ person: person })
      .exec(function(err, citations) {
        citations = sortCitations(citations, 'item');
        res.render('layout', {
          view: 'person/layout',
          subview: 'sources',
          title: person.name,
          paramPersonId: req.paramPersonId,
          personId: req.personId,
          person: person,
          sources: sources,
          citations: citations,
        });
      });
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

      var person = populateParents(req.personId, people);

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
    const person = findPersonInList(people, req.personId);
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
  .populate('parents')
  .populate('spouses')
  .populate('children')
  .exec(function(err, people) {
    var person = findPersonInList(people, req.personId);
    var compare = people.filter(thisPerson => {
      return thisPerson.name == 'Anna Peterson';
    })[0];
    var ancestorList = [];

    if (person._id == compare._id) {
      res.render('layout', {
        view: 'person/layout',
        subview: 'connection',
        title: person.name,
        paramPersonId: req.paramPersonId,
        person: person,
        compare: compare,
        people: people,
        isSame: true,
        isAncestor: false,
        ancestorList: ancestorList,
      });
      return;
    }

    console.log(person.children)

    if (person.children.length > 0) {
      if (isSamePerson(person.children[0], compare)) {
        ancestorList.push(person);
        ancestorList.push(compare);
        res.render('layout', {
          view: 'person/layout',
          subview: 'connection',
          title: person.name,
          paramPersonId: req.paramPersonId,
          person: person,
          compare: compare,
          people: people,
          isSame: false,
          isAncestor: true,
          ancestorList: ancestorList,
        });
        return;
      }
    }

    res.render('layout', {
      view: 'person/layout',
      subview: 'connection',
      title: person.name,
      paramPersonId: req.paramPersonId,
      person: person,
      compare: compare,
      people: people,
      isSame: false,
      isAncestor: false,
      ancestorList: ancestorList,
    });
  });
}

function personChecklist(req, res) {
  mongoose.model('Person')
  .findById(req.personId)
  .exec(function(err, person) {
    mongoose.model('Event')
    .find({ people: person })
    .exec(function(err, events) {
      mongoose.model('Source')
      .find({ people: person })
      .exec(function(err, sources) {
        var checklistLinks = {
          Ancestry: null,
          FamilySearch: null,
          FindAGrave: null,
          Lundberg: null,
        };

        person.links.forEach((url) => {
          if (url.match('lundbergancestry')) {
            checklistLinks.Lundberg = url;
          } else if (url.match('ancestry.com')) {
            checklistLinks.Ancestry = url;
          } else if (url.match('familysearch.org')) {
            checklistLinks.FamilySearch = url;
          } else if (url.match('findagrave')) {
            checklistLinks.FindAGrave = url;
          }
        });

        var checklistLife = {
          'Birth date': false,
          'Death date': false,
        };

        var birthYear = null;
        var deathYear = null;

        events.forEach((thisEvent) => {
          if (thisEvent.title == 'birth') {
            if (thisEvent.date != null && thisEvent.date.year != null) {
              checklistLife['Birth date'] = true;
              birthYear = thisEvent.date.year;
            }
          } else if (thisEvent.title == 'death') {
            if (thisEvent.date != null && thisEvent.date.year != null) {
              checklistLife['Death date'] = true;
              deathYear = thisEvent.date.year;
            }
          }
        });

        var sourceChecklist = {};

        sourceChecklist['grave'] = sources.filter((thisSource) => {
          return thisSource.type == 'grave';
        }).length > 0;

        for (var year = 1840; year <= 1940; year += 10) {
          if (birthYear != null && birthYear > year) {
            continue;
          }
          if (deathYear == null) {
            if (birthYear != null && year - birthYear > 90) {
              continue;
            }
          } else if (deathYear < year) {
            continue;
          }
          var sourceName = 'Census USA ' + year;
          sourceChecklist[sourceName] = false;
          sources.forEach((thisSource) => {
            if (thisSource.group == sourceName) {
              sourceChecklist[sourceName] = true;
            }
          });
        }

        if (birthYear != null && birthYear < 1900
            && deathYear != null && deathYear > 1917) {
          var sourceName = 'World War I draft';
          sourceChecklist[sourceName] = false;
          sources.forEach((thisSource) => {
            if (thisSource.group == sourceName) {
              sourceChecklist[sourceName] = true;
            }
          });
        }

        if (birthYear != null && birthYear < 1925
            && deathYear != null && deathYear > 1940) {
          var sourceName = 'World War II draft';
          sourceChecklist[sourceName] = false;
          sources.forEach((thisSource) => {
            if (thisSource.group == sourceName) {
              sourceChecklist[sourceName] = true;
            }
          });
        }

        res.render('layout', {
          view: 'person/layout',
          subview: 'checklist',
          title: person.name,
          paramPersonId: req.paramPersonId,
          person: person,
          checklistLinks: checklistLinks,
          checklistLife: checklistLife,
          sourceChecklist: sourceChecklist,
        });
      });
    });
  });
}

// HELPER

function findPersonInList(people, person) {
  return people.filter((thisPerson) => {
    return isSamePerson(thisPerson, person);
  })[0];
}

function isSamePerson(person1, person2) {
  var id1 = person1._id ? person1._id : person1;
  var id2 = person2._id ? person2._id : person2;
  id1 = '' + id1;
  id2 = '' + id2;
  return id1 == id2;
}

function populateParents(person, people, safety) {
  safety = safety || 0;

  if (safety > 30) {
    return person;
  }

  person = findPersonInList(people, person);

  person.testMe = 'hello';

  person.parents = person.parents.map((thisPerson) => {
    return populateParents(thisPerson, people, safety + 1);
  });

  return person;
}

function getSourceEvents(sources) {
  var events = [];

  sources.forEach(source => {
    var event = {
      title: source.group,
      date: { ...source.date },
      location: { ...source.location },
      people: [ ...source.people ],
      source: source,
    };

    if (source.type == 'newspaper') {
      event.type = source.type;
    } else if (source.type == 'document' && source.group.match('Census')) {
      event.type = 'census';
    } else {
      event.type = 'source';
    }

    events.push(event);
  });

  return events;
}

function filterEvents(events, person) {
  var children = person.children;
  var spouses = person.spouses;
  var birthYear = null;
  var deathYear = null;

  events = events.map((thisEvent) => {
    thisEvent.type = null;
    for (var i = 0; i < thisEvent.people.length; i++) {
      if (isSamePerson(thisEvent.people[i], person)) {
        thisEvent.type = 'personal';
        if (thisEvent.title == 'birth') {
          birthYear = thisEvent.date ? thisEvent.date.year : null;
        } else if (thisEvent.title == 'death') {
          deathYear = thisEvent.date ? thisEvent.date.year : null;
        }
        return thisEvent;
      }
    }

    for (var i = 0; i < thisEvent.people.length; i++) {
      for (var j = 0; j < spouses.length; j++) {
        if (isSamePerson(thisEvent.people[i], spouses[j])) {
          thisEvent.type = 'spouse';
          return thisEvent;
        }
      }
    }

    if (birthYear && thisEvent.date && thisEvent.date.year < birthYear) {
      return thisEvent;
    }

    if (deathYear && thisEvent.date && thisEvent.date.year > deathYear) {
      return thisEvent;
    }

    for (var i = 0; i < thisEvent.people.length; i++) {
      for (var j = 0; j < children.length; j++) {
        if (isSamePerson(thisEvent.people[i], children[j])) {
          thisEvent.type = 'child';
          return thisEvent;
        }
      }
    }

    return thisEvent;
  });

  events = events.filter((thisEvent) => {
    return thisEvent.type != null;
  });

  return events;
}

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
