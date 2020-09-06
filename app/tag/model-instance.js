const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

methods.getTagTitles = tools.getTagTitles;
methods.getTagValue = tools.getTagValue;
methods.hasTag = tools.hasTag;

methods.isModelAllowed = function(modelName) {
  return !this.restrictModels || this['allow' + modelName];
};

methods.canBeDeleted = async function() {
  for (let i in constants.modelsThatHaveTags) {
    const modelName = constants.modelsThatHaveTags[i].name;
    const items = await mongoose.model(modelName).find({tags: this});
    if (items.length) {
      return false;
    }
  }

  return true;
};

// Given the raw saved value for a tag, get the actual value based on the tag value type.
methods.getValueFor = function(rawTagValue) {
  // 0. Tag value type = not applicable. The tag is attached, so the value is true.
  // Example: "featured", "died young", "needs image"
  if (this.valueType === 0) {
    return true;
  }
  // 1. Tag value is anything input by textbox.
  // 2. Tag value is selected from preset list of values, but the actual text is saved.
  return rawTagValue;
};
