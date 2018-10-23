var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/:sourceId', makeSourceShowRoute('none'));
router.get('/:sourceId/editTitle', makeSourceShowRoute('title'));
router.post('/:sourceId/editTitle', makeSourcePostRoute('title'));
router.get('/:sourceId/editDate', makeSourceShowRoute('date'));
router.post('/:sourceId/editDate', makeSourcePostRoute('date'));
router.get('/:sourceId/addPerson', makeSourceShowRoute('people'));
router.post('/:sourceId/addPerson', makeSourcePostRoute('people'));

module.exports = router;

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
