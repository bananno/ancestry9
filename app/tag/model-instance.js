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
