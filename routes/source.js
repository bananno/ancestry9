var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var getDateValues = require('../tools/getDateValues');
var getLocationValues = require('../tools/getLocationValues');
var removePersonFromList = require('../tools/removePersonFromList');

router.get('/:sourceId', makeSourceShowRoute('none'));

makeSourcesRoutes('/type', 'type');
makeSourcesRoutes('/group', 'group');
makeSourcesRoutes('/title', 'title');
makeSourcesRoutes('Date', 'date');
makeSourcesRoutes('/location', 'location');
makeSourcesRoutes('Person', 'people', true);
makeSourcesRoutes('Link', 'links', true);
makeSourcesRoutes('Image', 'images', true);
makeSourcesRoutes('Content', 'content');
makeSourcesRoutes('/notes', 'notes');

makeSourcesRoutes('Citation', 'citations', true);

module.exports = router;

function makeSourcesRoutes(urlName, fieldName, canDelete) {
  if (canDelete) {
    var showOrEditPath = '/:sourceId/add' + urlName;
    var deletePath = '/:sourceId/delete' + urlName + '/:deleteId';
    router.get(showOrEditPath, makeSourceShowRoute(fieldName));
    router.post(showOrEditPath, makeSourcePostRoute(fieldName));
    router.post(deletePath, makeSourceDeleteRoute(fieldName));
  } else {
    var showOrEditPath = '/:sourceId/edit' + urlName;
    router.get(showOrEditPath, makeSourceShowRoute(fieldName));
    router.post(showOrEditPath, makeSourcePostRoute(fieldName));
  }
}

function makeSourceShowRoute(editField) {
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
              res.render('sources/show', {
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

function makeSourcePostRoute(editField) {
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
            res.redirect('/source/' + sourceId);
          }
        });
      });
    });
  };
}

function makeSourceDeleteRoute(editField) {
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
            res.redirect('/source/' + sourceId);
          }
        });
      });
    });
  };
}
