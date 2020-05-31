const constants = {};
module.exports = constants;

constants.modelsThatHaveTags = [
  {name: 'Event', plural: 'events'},
  {name: 'Image', plural: 'images'},
  {name: 'Notation', plural: 'notations'},
  {name: 'Person', plural: 'people'},
  {name: 'Source', plural: 'sources'},
  {name: 'Story', plural: 'stories'},
  {name: 'Tag', plural: 'tags'},
];

constants.modelAttrs = {};

constants.modelsThatHaveTags.forEach(({name}) => {
  constants.modelAttrs['allow' + name] = {type: Boolean, default: false};
});

const allowFieldList = constants.modelsThatHaveTags.map(({name}) => {
  return {
    name: 'allow' + name,
    toggle: true,
    onlyIf: tag => tag.restrictModels
  };
});

constants.fields = [
  {name: 'title'},
  {name: 'definition', inputType: 'textarea'},
  {name: 'category'},
  {
    name: 'valueType',
    toggle: true,
    maxValue: 2,
    valueNames: [
      'tag value not applicable',
      'use text text input',
      'use list of preset values'
    ],
  },
  {
    name: 'values',
    inputType: 'textarea',
    onlyIf: tag => tag.valueType === 2 || tag.values,
  },
  {name: 'restrictModels', toggle: true},
  ...allowFieldList,
  {name: 'tags', multi: true},
];

constants.indexFormats = ['definition', 'categories', 'grid'];
