const constants = {};
module.exports = constants;

// convert to old format - phase out
const modelSchema = require('./model-schema');

constants.fieldNames = modelSchema.filter(prop => prop.includeInExport);

constants.fields = modelSchema
  .filter(prop => {
    return prop.showInEditTable !== false;
  }).map(prop => {
    return {
      multi: prop.isArray,
      ...prop
    }
  });
