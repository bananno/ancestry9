const constants = {};
module.exports = constants;

constants.mainStoryTypes = [
  'book', 'cemetery', 'document', 'index',
  'newspaper', 'website', 'place', 'topic'
];

constants.noEntryStoryTypes = [
  'artifact', 'event', 'landmark', 'place'
];

const createFieldList = require('../tools/createFieldList');
const fieldInfo = createFieldList('story');
constants.fieldNames = fieldInfo.fieldNames;
constants.fields = fieldInfo.fields;
