const mongoose = require('mongoose');
const sorting = require('./sorting');
const dateStructure = require('./dateStructure');
const locationStructure = require('./locationStructure');

const tools = {
  mongoose,
  dateStructure,
  locationStructure,
  sorting,
  ...sorting,
  convertTags,
  reduceListToExportData,
  reduceToExportData,
};

module.exports = tools;

function convertTags(obj) {
  const tags = {};
  obj.tags.forEach(tag => {
    if (tag.match('=')) {
      let [key, value] = tag.split('=').map(s => s.trim());
      tags[key] = value;
    } else {
      tags[tag] = true;
    }
  });
  return tags;
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
  const tag = tagInput.title ? tagInput : this.tags.find(tag => tag.title === tagTitle);
  const itemTagIds = this.tags.map(tag => tag._id || tag);
  const idx = itemTagIds.indexOf(tag._id);
  return this.tagValues[idx];
};
