var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/:sourceId', makeSourceShowRoute('none'));

makeSourcesRoutes('Title', 'title');
makeSourcesRoutes('Date', 'date');
makeSourcesRoutes('Person', 'people', true);
makeSourcesRoutes('Link', 'links', true);
makeSourcesRoutes('Image', 'images', true);

module.exports = router;

function makeSourcesRoutes(urlName, fieldName, canDelete) {
  if (canDelete) {
    router.get('/:sourceId/add' + urlName, makeSourceShowRoute(fieldName));
    router.post('/:sourceId/add' + urlName, makeSourcePostRoute(fieldName));
  } else {
    router.get('/:sourceId/edit' + urlName, makeSourceShowRoute(fieldName));
    router.post('/:sourceId/edit' + urlName, makeSourcePostRoute(fieldName));
  }
}

function makeSourceShowRoute(editField) {
  return function(req, res, next) {
    var sourceId = req.params.sourceId;
    mongoose.model('Source').findById(sourceId)
    .populate('people')
    .exec(function(err, source) {
      mongoose.model('Person').find({}, function(err, people) {
        res.format({
          html: function() {
            res.render('sources/show', {
              source: source,
              editField: editField,
              people: people,
            });
          }
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
        updatedObj[editField] = {
          year: req.body.date_year,
          month: req.body.date_month,
          day: req.body.date_day,
        };
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
