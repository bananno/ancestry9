const modelsThatHaveTags = require('./constants-modelsThatHaveTags');

module.exports = [
  {
    name: 'title',
    dataType: String,
  },
  {
    name: 'definition',
    dataType: String,
    inputType: 'textarea',
  },
  {
    name: 'category',
    dataType: String,
  },
  {
    name: 'valueType',
    dataType: Number,
    inputType: 'dropdown',
    defaultValue: 0,
    valueNames: [
      'tag value not applicable',
      'use text text input',
      'use list of preset values',
    ],
  },
  {
    name: 'values',
    dataType: String,
    inputType: 'textarea',
    isEditable: tag => tag.valueType === 2 || tag.values,
  },
  {
    name: 'tags',
    dataType: 'tag',
    isList: true,
  },
  {
    name: 'restrictModels',
    dataType: Boolean,
    defaultValue: false,
  },
  ...modelsThatHaveTags.map(getFieldNameForAllowingModels),
];

function getFieldNameForAllowingModels(otherModel) {
  return {
    name: 'allow' + otherModel.name,
    dataType: Boolean,
    defaultValue: false,
    isEditable: tag => tag.restrictModels,
  };
}
