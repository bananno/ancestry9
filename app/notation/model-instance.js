const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');

const methods = {};
module.exports = methods;

methods.getTagTitles = tools.getTagTitles;

methods.getCategoryForStory = function() {
  if (this.title === 'source citation') {
    return 'citation';
  }
  if (this.title === 'excerpt' || this.tags.includes('excerpt')) {
    return 'except';
  }
  return 'other';
};
