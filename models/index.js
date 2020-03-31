const models = [
  'Citation',
  'Event',
  'Image',
  'Location',
  'Notation',
  'Person',
  'Source',
  'Story',
];

module.exports = {
  models,
  files: ['db', ...models.map(model => model.toLowerCase())]
};
