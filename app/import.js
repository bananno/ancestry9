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
  models: [],
  modelRef: {},
  ...modelTools,
};

models.forEach(modelName => {
  const Model = mongoose.model(modelName);
  module.exports[modelName] = Model;
  module.exports.models.push(Model);
  module.exports.modelRef[modelName] = Model;
});

tools.forEach(tool => {
  module.exports[tool] = require('./tools/' + tool);
});
