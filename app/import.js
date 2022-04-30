const tool = filename => require('../tools/' + filename);

const mongoose = require('mongoose');
const resources = require('./resources');
const modelTools = require('./tools/modelTools');

const tools = [
  'createController',
  'dateStructure',
  'getEditTableRows',
  'locationTools',
  'removeDuplicatesFromList',
  'reorderList',
  'sorting',
];

module.exports = {
  mongoose,
  models: [],
  modelRef: {},
  ...modelTools,
};

resources
  .filter(resource => resource.hasModel)
  .forEach(({Model, modelName}) => {
    module.exports[modelName] = Model;
    module.exports.models.push(Model);
    module.exports.modelRef[modelName] = Model;
  });

tools.forEach(tool => {
  module.exports[tool] = require('./tools/' + tool);
});
