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
  'Image',
  'Location',
  'Notation',
  'Story',
  'Source',
  'Tag',
];

const createModel = require('./tools/createModel');
updatedModels.forEach(createModel);

module.exports = models;

// OLD VERSIONS

const models2 = [
  'Person',
];

models2.forEach(model => {
  require('./' + model + '/model');
});
