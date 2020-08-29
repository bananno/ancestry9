const constants = {};
module.exports = constants;

const createFieldList = require('../tools/createFieldList');
const fieldInfo = createFieldList('notation');
constants.fieldNames = fieldInfo.fieldNames;
constants.fields = fieldInfo.fields;
