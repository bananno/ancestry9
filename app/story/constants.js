const constants = {};
module.exports = constants;

constants.mainStoryTypes = [
  'book', 'cemetery', 'document', 'index',
  'newspaper', 'website', 'place', 'topic'
];

constants.noEntryStoryTypes = [
  'artifact', 'event', 'landmark', 'place'
];

// convert to old format - phase out
const modelSchema = require('./model-schema');

constants.fieldNames = modelSchema.filter(prop => prop.includeInExport);

constants.fields = modelSchema
  .filter(prop => {
    return prop.showInEditTable !== false;
  }).map(prop => {
    return {
      name: prop.name,
      onlyIf: prop.onlyEditableIf,
      inputType: prop.inputType,
      multi: prop.isArray,
      toggle: prop.toggle,
    }
  });
