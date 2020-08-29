const constants = {};
module.exports = constants;

constants.mainSourceTypes = [
  'document', 'index', 'cemetery', 'newspaper',
  'photo', 'website', 'book', 'other'
];

const createFieldList = require('../tools/createFieldList');
const fieldInfo = createFieldList('source');
constants.fieldNames = fieldInfo.fieldNames;
constants.fields = fieldInfo.fields;
