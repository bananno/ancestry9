const constants = {};
module.exports = constants;

constants.modelsThatHaveTags = require('./constants-modelsThatHaveTags');

constants.indexFormats = ['definition', 'categories', 'grid'];

const createFieldList = require('../tools/createFieldList');
const fieldInfo = createFieldList('tag');
constants.fields = fieldInfo.fields;
