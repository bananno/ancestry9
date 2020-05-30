const constants = {};
module.exports = constants;

constants.fields = [
  {name: 'title'},
  {name: 'definition', inputType: 'textarea'},
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
  {name: 'tags', multi: true},
];

constants.modelsThatHaveTags = [
  {name: 'Event', plural: 'events'},
  {name: 'Image', plural: 'images'},
  {name: 'Notation', plural: 'notations'},
  {name: 'Person', plural: 'people'},
  {name: 'Source', plural: 'sources'},
  {name: 'Story', plural: 'stories'},
  {name: 'Tag', plural: 'tags'},
];
