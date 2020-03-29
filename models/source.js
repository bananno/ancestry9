const mongoose = require('mongoose');
const dateStructure = require('./dateStructure.js');
const locationStructure = require('./locationStructure.js');

const sourceSchema = new mongoose.Schema({
  title: String,
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  },
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  }],
  date: dateStructure,
  location: locationStructure,
  people: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  }],
  links: [String],
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
  }],
  tags: [String],
  content: String,
  notes: String,
  summary: String,
  sharing: { type: Boolean, default: false },
});

sourceSchema.statics.populateCiteText = populateCiteText;

sourceSchema.statics.sortByStory = function(sources) {
  sources.sort((a, b) => a.story.title < b.story.title ? -1 : 1);
};

mongoose.model('Source', sourceSchema);

// Get official text about source origin (e.g., MLA) NOT the citation model.
async function populateCiteText(sources) {
  const Notation = mongoose.model('Notation');

  for (let i in sources) {
    const source = sources[i];

    const sourceNotations = await Notation.getCitesForSource(source);
    const storyNotations = await Notation.getCitesForStory(source.story);

    source.citeText = [...sourceNotations, ...storyNotations]
      .map(notation => notation.text);
  }
}
