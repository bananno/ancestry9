const mongoose = require('mongoose');

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
citationSchema.statics.populateStories = populateStories;

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

async function populateStories(citations) {
  for (let i in citations) {
    await citations[i].populateStory();
  }
}
