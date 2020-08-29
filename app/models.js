const models = [
  'Citation',
  'Event',
  'Image',
  'Location',
  'Notation',
  'Person',
  'Source',
  'Story',
  'Tag',
];

const updatedModels = [
  'Citation',
  'Event',
  'Notation',
  'Story',
  'Source',
];

const createModel = require('./tools/createModel');
updatedModels.forEach(createModel);

module.exports = models;

// OLD VERSIONS

const models2 = [
  'Image',
  'Location',
  'Person',
  'Tag',
];

models2.forEach(model => {
  require('./' + model + '/model');
});
