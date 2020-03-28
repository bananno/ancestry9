const mongoose = require('mongoose');
const Notation = mongoose.model('Notation');
const Person = mongoose.model('Person');
const Story = mongoose.model('Story');
const tool = filename => require('../tools/' + filename);
const createModelRoutes = tool('createModelRoutes');
const sortPeople = tool('sortPeople');

module.exports = createRoutes;

function createRoutes(router) {
  createModelRoutes({
    Model: Notation,
    modelName: 'notation',
    router,
    index: notationsIndex,
    create: createNotation,
    show: showNotation,
    edit: editNotation,
    toggleAttributes: ['sharing'],
    singleAttributes: ['title', 'text', 'source', 'date', 'location'],
    listAttributes: ['people', 'stories', 'tags'],
  });
}

function notationsIndex(req, res, next) {
  Notation.find({}, (err, notations) => {
    res.render('layout', {
      view: 'notations/index',
      title: 'Notations',
      notations: notations,
    });
  });
}

function createNotation(req, res, next) {
  const newNotation = {
    title: req.body.title.trim(),
  };
  Notation.create(newNotation, (err, notation) => {
    if (err) {
      return res.send('There was a problem adding the information to the database.');
    }
    res.redirect('/notation/' + notation._id + '/edit');
  });
}

function withNotation(req, res, callback) {
  const notationId = req.params.id;
  Notation
  .findById(notationId)
  .populate('source')
  .populate('people')
  .populate('stories')
  .exec((err, notation) => {
    if (!notation) {
      return res.send('Notation not found.');
    }
    if (notation.source) {
      Story.findById(notation.source.story, (err, story) => {
        if (story) {
          notation.source.story = story;
        }
        callback(notation);
      });
    } else {
      callback(notation);
    }
  });
}

function showNotation(req, res, next) {
  withNotation(req, res, notation => {
    res.render('layout', {
      view: 'notations/show',
      title: 'Notation',
      notation,
    });
  });
}

function editNotation(req, res, next) {
  withNotation(req, res, notation => {
    Person.find({}, (err, people) => {
      sortPeople(people, 'name');
      Story.find({}, (err, stories) => {
        res.render('layout', {
          view: 'notations/edit',
          title: 'Notation',
          notation,
          people,
          stories,
        });
      });
    });
  });
}
