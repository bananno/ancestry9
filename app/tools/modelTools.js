const mongoose = require('mongoose');
const sorting = require('./sorting');
const dateStructure = require('./dateStructure');
const locationTools = require('./locationTools');

const tools = {
  mongoose,
  convertTags,
  convertTags2, // TO DO: merge these two methods somehow
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

// Returns the converted tags but does not modify the instance itself.
// Must populate tags before calling.
function convertTags2({asList} = {}) {
  const tagObj = tools.convertTags(this);
  if (!asList) {
    return tagObj;
  }
  return this.tags.map((tag, i) => ({
    title: tag.title,
    id: tag._id,
    value: tagObj[tag.title],
  }));
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

// Given either a tag, tag id, or tag title, get this instance's
// value for that tag. E.g., given "number of children", return "6".
// This instance's tags do not have to be populated.
tools.getTagValue = function(tagInput) {
  if (!this.tags.length) {
    return undefined;
  }

  // The input might be a tag {_id, title} or just the id or title
  const lookForTagId = tagInput._id ? String(tagInput._id) : String(tagInput);
  const lookForTagTitle = tagInput.title || tagInput.title;

  // the tags list might be objects or just ids
  const areTagsPopulated = !!this.tags[0].title;

  if (areTagsPopulated) {
    for (let i = 0; i < this.tags.length; i++) {
      if (this.tags[i].title === lookForTagTitle) {
        return this.tagValues[i];
      }
      if (String(this.tags[i]._id) === lookForTagId) {
        return this.tagValues[i];
      }
    }
  } else {
    for (let i = 0; i < this.tags.length; i++) {
      if (String(this.tags[i]) === lookForTagId) {
        return this.tagValues[i];
      }
    }
  }
};

tools.hasTag = function(tagTitle) {
  return this.tags.some(tag => tag.title === tagTitle);
};
