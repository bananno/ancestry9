const modelsThatHaveTags = require('./constants-modelsThatHaveTags');

module.exports = [
  {
    name: 'title',
    type: String,
  },
  {
    name: 'definition',
    type: String,
    inputType: 'textarea',
  },
  {
    name: 'category',
    type: String,
  },
  {
    name: 'valueType',
    type: Number,
    toggle: true,
    defaultValue: 0,
    maxValue: 2,
    valueNames: [
      'tag value not applicable',
      'use text text input',
      'use list of preset values',
    ],
  },
  {
    name: 'values',
    type: String,
    inputType: 'textarea',
    onlyEditableIf: tag => tag.valueType === 2 || tag.values,
  },
  {
    name: 'restrictModels',
    type: Boolean,
    toggle: true,
    defaultValue: false,
  },
  {
    name: 'tags',
    specialType: 'tags',
    references: 'Tag',
    isArray: true,
  },
  ...modelsThatHaveTags.map(getFieldNameForAllowingModels),
];

function getFieldNameForAllowingModels(otherModel) {
  return {
    name: 'allow' + otherModel.name,
    type: Boolean,
    toggle: true,
    defaultValue: false,
    onlyEditableIf: tag => tag.restrictModels,
  };
}
