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
sourceSchema.methods.populateCiteText = populateCiteTextSingle;
sourceSchema.methods.populatePersonCitations = populatePersonCitations;

sourceSchema.statics.populateCiteText = populateCiteTextList;

sourceSchema.statics.sortByStory = function(sources) {
  tools.sortBy(sources, source => {
    return [source.story.type, source.story.title, source.title].join(' - ');
  });
};

mongoose.model('Source', sourceSchema);

async function populateCitations(person) {
  this.citations = await mongoose.model('Citation').find({source: this});
}

// Get official text about source origin (e.g., MLA) NOT the citation model.
async function populateCiteTextSingle(options = {}) {
  const sourceNotations = await mongoose.model('Notation')
    .getCitesForSource(this);

  let notations = [...sourceNotations];

  if (options.includeStory !== false) {
    const storyNotations = await mongoose.model('Notation')
      .getCitesForStory(this.story);

    if (options.storyFirst) {
      notations = [...storyNotations, ...notations];
    } else {
      notations = [...notations, ...storyNotations];
    }
  }

  this.citeText = notations.map(notation => notation.text);
}

async function populatePersonCitations(person) {
  this.citations = await mongoose.model('Citation').find({source: this, person});
}

async function populateCiteTextList(sources) {
  for (let i in sources) {
    await sources[i].populateCiteText();
  }
}
