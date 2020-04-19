const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');
const methods = {};
module.exports = methods;

methods.toSharedObject = function() {
  const story = tools.reduceToExportData(this, constants.fieldNames);

  // Remove non-shared people and then un-populate people.
  story.people = story.people
    .filter(person => person.isPublic())
    .map(person => person._id);

  // No need to un-populate images because they only exist as attributes
  // of their parent story or source.
  story.images = story.images.map(image => image.toSharedObject());

  return story;
}
