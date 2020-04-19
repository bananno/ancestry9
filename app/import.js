const tool = filename => require('../tools/' + filename);

const mongoose = require('mongoose');
const models = require('./models').models;
const modelTools = require('./tools/modelTools');

const tools = [
  'createModelRoutes',
  'removeDuplicatesFromList',
  'reorderList',
  'dateStructure',
  'locationStructure',
  'sorting',
];

module.exports = {
  mongoose,
  ...modelTools,
};

models.forEach(model => {
  module.exports[model] = mongoose.model(model);
});

tools.forEach(tool => {
  module.exports[tool] = require('./tools/' + tool);
});
