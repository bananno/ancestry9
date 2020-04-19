const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');

const methods = {};
module.exports = methods;

methods.getAllSharedData = async () => {
  const notations = await mongoose.model('Notation').find({sharing: true})
    .populate('people');

  return notations.map(notation => {
    // Remove non-shared people from the notation.
    // Then un-populate people, leaving _id only.
    notation.people = notation.people.map(person => {
      return person.isPublic() ? person._id : false;
    }).filter(Boolean);

    return tools.reduceToExportData(notation, constants.fieldNames);
  });
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