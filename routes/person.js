var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var sortEvents = require('../tools/sortEvents');
var sortCitations = require('../tools/sortCitations');
var sortSources = require('../tools/sortSources');
var removePersonFromList = require('../tools/removePersonFromList');
var getNewEventValues = require('../tools/getNewEventValues');

convertParamPersonId();

router.get('/:personId', makeRouteGet('none'));
router.get('/:personId/sources', personSources);
router.get('/:personId/nationality', personNationality);
router.get('/:personId/relatives', personRelatives);
router.get('/:personId/checklist', personChecklist);

router.get('/:personId/addEvent', makeRouteGet('events'));
router.post('/:personId/addEvent', makeRouteEditPost('events'));

router.get('/:personId/edit', makeRouteEditGet('none'));

router.get('/:personId/edit/name', makeRouteEditGet('name'));
router.post('/:personId/edit/name', makeRouteEditPost('name'));

router.get('/:personId/edit/id', makeRouteEditGet('customId'));
router.post('/:personId/edit/id', makeRouteEditPost('customId'));

router.get('/:personId/edit/links', makeRouteEditGet('links'));
router.post('/:personId/edit/links', makeRouteEditPost('links'));
router.post('/:personId/delete/links/:deleteId', makeRouteDelete('links'));

createRelationshipRoutes('parents', 'children');
createRelationshipRoutes('spouses', 'spouses');
createRelationshipRoutes('children', 'parents');

module.exports = router;

function createRelationshipRoutes(relationship, corresponding) {
  var showEditPath = '/:personId/edit/' + relationship;
  var deletePath = '/:personId/delete/' + relationship + '/:deleteId';

  router.get(showEditPath, makeRouteEditGet(relationship));
  router.post(showEditPath, makeRouteEditPost(relationship, corresponding));
  router.post(deletePath, makeRouteDelete(relationship, corresponding));
}

function convertParamPersonId() {
  router.param('personId', function(req, res, next, paramPersonId) {
    mongoose.model('Person').findById(paramPersonId, function (err, person) {
      if (err || person == null) {
        mongoose.model('Person').find({}, function (err, people) {
          var personWithId = people.filter(function(thisPerson) {
            return thisPerson.customId == paramPersonId;
          });
          if (personWithId.length) {
            req.personId = personWithId[0]._id;
            req.person = personWithId[0];
            next();
          } else {
            console.log('Person with ID "' + paramPersonId + '" was not found.');
            res.status(404);
            res.render('people/notFound', { personId: paramPersonId });
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

function makeRouteGet(editView) {
  return function(req, res, next) {
    mongoose.model('Person').findById(req.personId)
    .populate('parents')
    .populate('spouses')
    .populate('children')
    .exec(function(err, person) {
      mongoose.model('Person')
      .find({})
      .exec(function(err, allPeople) {
        mongoose.model('Event')
        .find({})
        // .find({ people: person })
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
            events = filterEvents(events, person);
            citations = sortCitations(citations, 'item');

            res.format({
              html: function() {
                res.render('people/show', {
                  personId: req.personId,
                  person: person,
                  people: people,
                  siblings: siblings,
                  events: events,
                  editView: editView,
                  citations: citations,
                });
              }
            });
          });
        });
      });
    });
  };
}

function makeRouteEditGet(editView) {
  return function(req, res, next) {
    mongoose.model('Person').findById(req.personId)
    .populate('parents')
    .populate('spouses')
    .populate('children')
    .exec(function(err, person) {
      mongoose.model('Person').find({}, function(err, allPeople) {
        var people = removePersonFromList(allPeople, person);
        res.format({
          html: function() {
            res.render('people/edit', {
              personId: req.personId,
              person: person,
              people: people,
              editView: editView,
            });
          }
        });
      });
    });
  };
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
          redirectUrl += (person.customId || person._id);
        }

        if (editField != 'events') {
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
            res.redirect('/person/' + (person.customId || person._id) + '/edit');
          }
        });
       }
    });
  };
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
        res.format({
          html: function() {
            sources = sortSources(sources, 'group');
            res.render('people/sources', {
              personId: req.personId,
              person: person,
              sources: sources,
              citations: citations,
            });
          }
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
          res.render('people/nationality', {
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
    var person = findPersonInList(people, req.personId);
    var relationships = [];
    var peopleGroups = {};
    var peoplePlaced = {};

    peopleGroups = getRelatives(peopleGroups, people, person, 0, peoplePlaced, 'child');
    peopleGroups = getRelatives(peopleGroups, people, person, 0, peoplePlaced, 'parent');

    relationships.push('person');
    peopleGroups['person'] = [person];
    peoplePlaced[person._id] = true;

    relationships.push('parents');
    peopleGroups['parents'] = [];
    person.parents.forEach((thisPerson) => {
      if (peoplePlaced[thisPerson._id] == null) {
        peopleGroups['parents'].push(thisPerson);
      }
    });

    relationships.push('spouses');
    peopleGroups['spouses'] = [];
    relationships.push('parents-in-law');
    peopleGroups['parents-in-law'] = [];
    person.spouses.forEach((thisPerson) => {
      if (peoplePlaced[thisPerson._id] == null) {
        peopleGroups['spouses'].push(thisPerson);
      }
    });

    relationships.push('children');
    relationships.push('grandchildren');
    peopleGroups['children'] = [];
    peopleGroups['grandchildren'] = [];
    person.children.forEach((thisPerson) => {
      if (peoplePlaced[thisPerson._id] == null) {
        peoplePlaced[thisPerson._id] = true;
        peopleGroups['children'].push(thisPerson);
        thisPerson.children.forEach((thisPerson2) => {
          thisPerson2 = findPersonInList(people, thisPerson2);
          if (peoplePlaced[thisPerson2._id] == null) {
            peoplePlaced[thisPerson2._id] = true;
            peopleGroups['grandchildren'].push(thisPerson2);
          }
        });
      }
    });

    relationships.push('not found');
    peopleGroups['not found'] = [];
    people.forEach((thisPerson) => {
      if (peoplePlaced[thisPerson._id] == null) {
        peopleGroups['not found'].push(thisPerson);
      }
    });

    res.format({
      html: function() {
        res.render('people/relatives', {
          person: person,
          people: people,
          relationships: relationships,
          peopleGroups: peopleGroups,
        });
      }
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

      res.format({
        html: function() {
          res.render('people/checklist', {
            person: person,
            checklistLinks: checklistLinks,
          });
        }
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

function getRelatives(peopleGroups, people, person, generation, peoplePlaced, direction) {
  return peopleGroups;
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
