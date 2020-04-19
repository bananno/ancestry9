const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const staticMethods = require('./model-static');

const citationSchema = new mongoose.Schema({
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
  },
  item: String,
  information: String,
});

citationSchema.methods.populateStory = populateStory;

for (let methodName in staticMethods) {
  citationSchema.statics[methodName] = staticMethods[methodName];
}

mongoose.model('Citation', citationSchema);

async function populateStory() {
  if (!this.source.title) {
    this.source = await mongoose.model('Source')
      .findById(this.source).populate('story');
  } else if (!this.source.story.title) {
    this.source.story = await mongoose.model('Story')
      .findById(this.source.story);
  }
}
