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
];

const createModel = require('./tools/createModel');
updatedModels.forEach(createModel);

module.exports = models;

// OLD VERSIONS

const models2 = [
  'Event',
  'Image',
  'Location',
  'Notation',
  'Person',
  'Source',
  'Story',
  'Tag',
];

models2.forEach(model => {
  require('./' + model + '/model');
});
