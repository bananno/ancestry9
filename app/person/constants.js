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
      multi: prop.isArray,
      dataType: prop.references === 'Person' ? 'people' : undefined,
      ...prop
    }
  });
