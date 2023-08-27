const mongoose = require('mongoose');
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

methods.toSharedObject = function() {
  const itemArr = this.item.split(' - ');
  return {
    id: this._id,
    itemPart1: itemArr.shift(),
    itemPart2: itemArr.join(' '),
    information: this.information,
    personId: this.person._id,
    sourceId: this.source._id,
  };
};
