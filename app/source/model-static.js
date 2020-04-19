const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const methods = {};
module.exports = methods;

methods.populateCiteText = async sources => {
  for (let i in sources) {
    await sources[i].populateCiteText();
  }
};

methods.sortByStory = sources => {
  tools.sortBy(sources, source => {
    return [source.story.type, source.story.title, source.title].join(' - ');
  });
};
