const constants = {};
module.exports = constants;

constants.fieldNamesEveryone = [
  '_id', 'parents', 'spouses', 'children',
];

constants.fieldNamesShared = [
  'name', 'customId', 'links', 'profileImage', 'gender',
];

// convert to old format - phase out
const modelSchema = require('./model-schema');

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
      onAdd: prop.onAdd,
      onDelete: prop.onDelete,
      dataType: prop.references === 'Person' ? 'people' : undefined,
    }
  });
