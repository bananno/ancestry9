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
      name: prop.name,
      onlyIf: prop.onlyEditableIf,
      inputType: prop.inputType,
      multi: prop.isArray,
      toggle: prop.toggle,
      maxValue: prop.maxValue,
      valueNames: prop.valueNames,
    }
  });
