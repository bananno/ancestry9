var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var getDateValues = require('../tools/getDateValues');
var getLocationValues = require('../tools/getLocationValues');
var removePersonFromList = require('../tools/removePersonFromList');

router.get('/:sourceId', sourceShow);
router.get('/:sourceId/edit', makeRouteEditGet('none'));

makeSourcesRoutes('type');
makeSourcesRoutes('group');
makeSourcesRoutes('title');
makeSourcesRoutes('date');
makeSourcesRoutes('location');
makeSourcesRoutes('people', true);
makeSourcesRoutes('links', true);
makeSourcesRoutes('images', true);
makeSourcesRoutes('content');
makeSourcesRoutes('notes');
makeSourcesRoutes('citations', true);

module.exports = router;

function makeSourcesRoutes(fieldName, canAddDeleteReorder) {
  if (canAddDeleteReorder) {
    var showOrEditPath = '/:sourceId/add/' + fieldName;
    var deletePath = '/:sourceId/delete/' + fieldName + '/:deleteId';
    var reorderPath = '/:sourceId/reorder/' + fieldName + '/:orderId';
    router.get(showOrEditPath, makeRouteEditGet(fieldName));
    router.post(showOrEditPath, makeRouteEditPost(fieldName));
    router.post(deletePath, makeRouteDelete(fieldName));
    router.post(reorderPath, makeRouteReorder(fieldName));
  } else {
    var showOrEditPath = '/:sourceId/edit/' + fieldName;
    router.get(showOrEditPath, makeRouteEditGet(fieldName));
    router.post(showOrEditPath, makeRouteEditPost(fieldName));
  }
}

function sourceShow(req, res) {
  var sourceId = req.params.sourceId;
  mongoose.model('Source')
  .findById(sourceId)
  .populate('people')
  .exec(function(err, source) {
    mongoose.model('Citation')
    .find({ source: source })
    .populate('person')
    .exec(function(err, citations) {
      res.format({
        html: function() {
          res.render('sources/show', {
            source: source,
            citations: citations,
          });
        }
      });
    });
  });
}

function makeRouteEditGet(editField) {
  return function(req, res, next) {
    var sourceId = req.params.sourceId;
    mongoose.model('Source')
    .findById(sourceId)
    .populate('people')
    .exec(function(err, source) {
      mongoose.model('Person')
      .find({})
      .exec(function(err, people) {
        mongoose.model('Citation')
        .find({ source: source })
        .populate('person')
        .exec(function(err, citations) {
          source.people.forEach((thisPerson) => {
            people = removePersonFromList(people, thisPerson);
          });

          people = [].concat(source.people).concat(people);

          res.format({
            html: function() {
              res.render('sources/edit', {
                source: source,
                editField: editField,
                people: people,
                citations: citations,
              });
            }
          });
        });
      });
    });
  };
}

function makeRouteEditPost(editField) {
  return function(req, res) {
    var sourceId = req.params.sourceId;
    mongoose.model('Source').findById(sourceId, function(err, source) {
      var updatedObj = {};

      if (editField == 'date') {
        updatedObj[editField] = getDateValues(req);
      } else if (editField == 'location') {
        updatedObj[editField] = getLocationValues(req);
      } else if (editField == 'people') {
        var personId = req.body[editField];
        updatedObj[editField] = source.people;
        updatedObj[editField].push(personId);
      } else if (editField == 'links' || editField == 'images') {
        var newValue = req.body[editField].trim();
        if (newValue == '') {
          return;
        }
        updatedObj[editField] = (source[editField] || []).concat(newValue);
      } else if (editField == 'citations') {
        var newItem = {
          item: req.body.item.trim(),
          information: req.body.information.trim(),
          person: req.body.person,
          source: source,
        };

        if (newItem.item == '' || newItem.information == '' || newItem.person == '0') {
          return;
        }

        mongoose.model('Citation').create(newItem, function() { });
      } else {
        updatedObj[editField] = req.body[editField];
      }

      source.update(updatedObj, function(err) {
        res.format({
          html: function() {
            res.redirect('/source/' + sourceId + '/edit');
          }
        });
      });
    });
  };
}

function makeRouteDelete(editField) {
  return function(req, res) {
    var sourceId = req.params.sourceId;
    mongoose.model('Source').findById(sourceId, function(err, source) {
      var updatedObj = {};
      var deleteId = req.params.deleteId;

      if (editField == 'people') {
        updatedObj[editField] = removePersonFromList(source[editField], deleteId);
      } else if (editField == 'links' || editField == 'images') {
        updatedObj[editField] = source[editField].filter((url, i) => {
          return i != deleteId;
        });
      } else if (editField == 'citations') {
        var citationId = req.params.deleteId;
         mongoose.model('Citation').findById(citationId, function(err, citation) {
          citation.remove(function() { });
        });
      }

      source.update(updatedObj, function(err) {
        res.format({
          html: function() {
            res.redirect('/source/' + sourceId + '/edit');
          }
        });
      });
    });
  };
}

function makeRouteReorder(editField) {
  return function(req, res) {
    var sourceId = req.params.sourceId;
    mongoose.model('Source')
    .findById(sourceId)
    .exec(function(err, source) {
      var updatedObj = {};
      updatedObj[editField] = source[editField];
      var orderId = req.params.orderId;

      if (editField == 'people') {
        for (var i = 1; i < updatedObj.people.length; i++) {
          var thisPerson = updatedObj.people[i];
          if (isSamePerson(thisPerson, orderId)) {
            updatedObj.people[i] = updatedObj.people[i - 1];
            updatedObj.people[i - 1] = thisPerson;
            break;
          }
        }
      } else if (editField == 'links' || editField == 'images') {
        if (orderId > 0 && updatedObj[editField].length > orderId) {
          var temp = updatedObj[editField][orderId - 1];
          updatedObj[editField][orderId - 1] = updatedObj[editField][orderId];
          updatedObj[editField][orderId] = temp;
        }
      }

      source.update(updatedObj, function(err) {
        res.format({
          html: function() {
            res.redirect('/source/' + sourceId + '/edit');
          }
        });
      });
    });
  };
}

// HELPER

function isSamePerson(person1, person2) {
  var id1 = person1._id ? person1._id : person1;
  var id2 = person2._id ? person2._id : person2;
  id1 = '' + id1;
  id2 = '' + id2;
  return id1 == id2;
}
