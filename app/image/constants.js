const constants = {};
module.exports = constants;

const createFieldList = require('../tools/createFieldList');
const fieldInfo = createFieldList('image');
constants.fieldNames = fieldInfo.fieldNames;
constants.fields = fieldInfo.fields;
