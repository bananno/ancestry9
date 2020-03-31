const tool = filename => require('../tools/' + filename);

const mongoose = require('mongoose');
const models = require('../models').models;
const {sortBy} = require('../models/tools');

const tools = [
  'createModelRoutes',
  'getDateValues',
  'getLocationValues',
  'getNewEventValues',
  'removeDuplicatesFromList',
  'reorderList',
  'sortCitations',
  'sortEvents',
];

module.exports = {
  mongoose,
  sortBy,
};

models.forEach(model => {
  module.exports[model] = mongoose.model(model);
});

tools.forEach(tool => {
  module.exports[tool] = require('../tools/' + tool);
});
