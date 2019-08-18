const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
module.exports = router;

const Source = mongoose.model('Source');

const getTools = (path) => { return require('../../tools/' + path) };
const createModelRoutes = getTools('createModelRoutes');

createModelRoutes({
  Model: Source,
  modelName: 'story',
  modelNamePlural: 'stories',
  router: router,
  index: storiesIndex,
  create: null,
  show: null,
  edit: null,
  toggleAttributes: [],
  singleAttributes: [],
  listAttributes: [],
});

function storiesIndex(req, res, next) {
  mongoose.model('Source').find({ type: 'story' }, (err, stories) => {
    res.render('layout', {
      view: 'sources/stories',
      title: 'Stories',
      stories: stories,
      showNew: false,
      mainSourceTypes: [],
    });
  });
}
