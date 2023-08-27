const mongoose = require('mongoose');

const {citationItemOrder, citationItemSubOrder} = require('./citation.constants');

const methods = {};
module.exports = methods;

methods.populateStory = async function() {
  if (!this.source.title) {
    this.source = await mongoose.model('Source')
      .findById(this.source).populate('story');
  } else if (!this.source.story.title) {
    this.source.story = await mongoose.model('Story')
      .findById(this.source.story);
  }
  this.source.populateFullTitle();
};

// Separate the "item" property into two parts, mainly to make
// the citation table look nice by grouping the parts together.
methods.getItemParts = function() {
  if (!this.itemParts) {
    const itemArr = this.item.split(' - ');
    this.itemParts = [itemArr.shift(), itemArr.join(' ')];
  }
  return this.itemParts;
};

// Get the string by which to sort the citation.
// Need to call getItemParts() first.
methods.getSortKey = function() {
  const pad = num => String(num).padStart(2, '0');

  if (!this.sortKey) {
    const keyParts = [];

    const item1Index = citationItemOrder.indexOf(this.itemParts[0]);
    if (item1Index === -1) {
      keyParts.push(pad(citationItemOrder.length));
      keyParts.push(this.itemParts[0]);
    } else {
      keyParts.push(pad(item1Index));
    }

    const item2Index = citationItemSubOrder.indexOf(this.itemParts[1]);
    if (item2Index === -1) {
      keyParts.push(pad(citationItemSubOrder.length));
      keyParts.push(this.itemParts[1]);
    } else {
      keyParts.push(pad(item2Index));
    }

    keyParts.push(this.information);

    this.sortKey = keyParts.join('-');
  }

  return this.sortKey;
};

methods.toSharedObject = function() {
  this.getItemParts();
  return {
    id: this._id,
    itemPart1: this.itemParts[0],
    itemPart2: this.itemParts[1],
    information: this.information,
    personId: this.person._id,
    sourceId: this.source._id,
    sortKey: this.getSortKey(),
  };
};
