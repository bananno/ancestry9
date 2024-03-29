// This object is modified by reference in createModel.js
// and future imports of the file are affected
module.exports = [
  {
    name: 'api',
    hasRoutes: true,
    hasModel: false,
  },
  {
    name: 'checklist',
    hasRoutes: true,
    hasModel: false,
  },
  {
    name: 'citation',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Citation',
  },
  {
    name: 'event',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Event',
  },
  {
    name: 'export',
    hasRoutes: true,
    hasModel: false,
  },
  {
    name: 'highlight',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Highlight',
  },
  {
    name: 'image',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Image',
  },
  {
    name: 'location',
    hasRoutes: false,
    hasModel: true,
    modelName: 'Location',
  },
  {
    name: 'place',
    hasRoutes: true,
    hasModel: false,
  },
  {
    name: 'map',
    hasRoutes: true,
    hasModel: false,
  },
  {
    name: 'misc',
    hasRoutes: true,
    hasModel: false,
  },
  {
    name: 'notation',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Notation',
  },
  {
    name: 'person',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Person',
  },
  {
    name: 'source',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Source',
  },
  {
    name: 'story',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Story',
  },
  {
    name: 'tag',
    hasRoutes: true,
    hasModel: true,
    modelName: 'Tag',
  },
];
