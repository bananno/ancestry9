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
};

methods.toSharedObject = function() {
  return {
    _id: this._id,
    source: this.source._id,
    person: this.person._id,
    item: this.item,
    information: this.information,
  };
};
