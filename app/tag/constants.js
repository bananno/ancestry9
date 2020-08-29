const constants = {};
module.exports = constants;

constants.modelsThatHaveTags = require('./constants-modelsThatHaveTags');

constants.indexFormats = ['definition', 'categories', 'grid'];

// convert to old format - phase out
const modelSchema = require('./model-schema');

constants.fields = modelSchema
  .filter(prop => {
    return prop.showInEditTable !== false;
  }).map(prop => {
    return {
      multi: prop.isArray,
      ...prop
    }
  });
