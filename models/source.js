const mongoose = require('mongoose');
const tools = require('./tools');
const dateStructure = require('./dateStructure');
const locationStructure = require('./locationStructure');

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

sourceSchema.methods.populateCitations = populateCitations;
sourceSchema.methods.populatePersonCitations = populatePersonCitations;

sourceSchema.statics.populateCiteText = populateCiteText;

sourceSchema.statics.sortByStory = function(sources) {
  tools.sortBy(sources, source => {
    return [source.story.type, source.story.title, source.title].join(' - ');
  });
};

mongoose.model('Source', sourceSchema);

async function populateCitations(person) {
  this.citations = await mongoose.model('Citation').find({source: this});
}

async function populatePersonCitations(person) {
  this.citations = await mongoose.model('Citation').find({source: this, person});
}

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
