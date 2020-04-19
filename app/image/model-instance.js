const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

methods.toSharedObject = function() {
  return tools.reduceToExportData(this, constants.fieldNames);
}

methods.populateParent = async function() {
  this.source = await mongoose.model('Source').findOne({images: this})
    .populate('story');
  this.story = await mongoose.model('Story').findOne({images: this});
}
