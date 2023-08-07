const mongoose = require('mongoose');
const sorting = require('./sorting');
const dateStructure = require('./dateStructure');
const locationTools = require('./locationTools');

const tools = {
  mongoose,
  convertTags,
  dateStructure,
  isValidMongooseId: mongoose.Types.ObjectId.isValid,
  locationTools,
  sorting,
  ...sorting,
  reduceListToExportData,
  reduceToExportData,
};

module.exports = tools;

function convertTags({tags, tagValues}) {
  const convertedTags = {};
  tags.forEach((tag, i) => {
    convertedTags[tag.title] = tag.getValueFor(tagValues[i]);
  });
  return convertedTags;
}

function reduceListToExportData(list, fields) {
  return list.map(itemInfo => reduceToExportData(itemInfo, fields));
}

function reduceToExportData(itemInfo, fields) {
  const newItem = {};
  fields.forEach(attr => newItem[attr] = itemInfo[attr]);
  newItem.tags = convertTags(itemInfo);
  return newItem;
}

tools.getTagTitles = function() {
  return this.tags.map(tag => tag.title);
};

tools.getTagValue = function(tagInput) {
  const tag = tagInput.title ? tagInput : this.tags.find(tag => tag.title === tagInput);
  if (!tag) {
    return undefined;
  }
  const itemTagIds = this.tags.map(tag => tag._id || tag);
  const idx = itemTagIds.indexOf(tag._id);
  return this.tagValues[idx];
};

tools.hasTag = function(tagTitle) {
  return this.tags.some(tag => tag.title === tagTitle);
};
