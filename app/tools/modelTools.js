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

tools.getTagValue = function(tagTitle) {
  const tag = this.tags.find(tag => tag.title === tagTitle);
  const idx = this.tags.indexOf(tag);
  return this.tagValues[idx];
};
