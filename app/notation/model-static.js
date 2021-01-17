const mongoose = require('mongoose');
const tools = require('../tools/modelTools');

const methods = {};
module.exports = methods;

methods.getAllSharedData = async () => {
  const Notation = mongoose.model('Notation');

  const notations = await Notation.find({sharing: true})
    .populate('people')
    .populate('tags');

  const {exportFieldNames} = Notation.constants();

  return notations.map(notation => {
    // Remove non-shared people from the notation.
    // Then un-populate people, leaving _id only.
    notation.people = notation.people.map(person => {
      return person.isPublic() ? person._id : false;
    }).filter(Boolean);

    return tools.reduceToExportData(notation, exportFieldNames);
  });
};

methods.getFormDataNew = req => {
  const notationTitle = req.body.title.trim();

  if (!notationTitle) {
    return false;
  }

  const newNotation = {
    title: notationTitle,
    text: (req.body.text || '').trim(),
    people: [],
    stories: [],
    tags: req.getFormDataTags(),
    date: req.getFormDataDate(),
    location: req.getFormDataLocation(),
  };

  return newNotation;
};

methods.getCitesForSource = async function(source) {
  return await mongoose.model('Notation').find({
    title: 'source citation',
    source
  });
};

methods.getCitesForStory = async function(story) {
  return await mongoose.model('Notation').find({
    title: 'source citation',
    stories: story
  });
};
