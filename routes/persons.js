var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/', getPersonsIndexRoute(false));
router.get('/new', getPersonsIndexRoute(true));
router.post('/new', createNewPerson);

module.exports = router;

function getPersonsIndexRoute(showNew) {
  return function(req, res, next) {
    mongoose.model('Person').find({}, function (err, persons) {
      if (err) {
        return console.error(err);
      } else {
        res.format({
          html: function() {
            res.render('persons', {
              persons: persons,
              showNew: showNew,
            });
          }
        });
      }
    });
  };
}

function createNewPerson(req, res, next) {
  var newPerson = {
    name: req.body.name,
    customId: req.body.name,
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
          res.redirect('/persons');
        }
      });
    }
  });
}
