const constants = {};
module.exports = constants;

constants.fieldNamesEveryone = [
  '_id', 'parents', 'spouses', 'children',
];

constants.fieldNamesShared = [
  'name', 'customId', 'links', 'profileImage', 'gender',
];

const createFieldList = require('../tools/createFieldList');
const fieldInfo = createFieldList('person', {useDataType: true});
constants.fields = fieldInfo.fields;
