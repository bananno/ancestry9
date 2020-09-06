const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const methods = {};
module.exports = methods;

methods.getAllSharedData = async (imageMap) => {
  const sources = await mongoose.model('Source').find({sharing: true})
    .populate('people').populate('story').populate('tags');

  return sources.map(source => source.toSharedObject({imageMap}));
};

methods.getFormDataNew = req => {
  const sourceTitle = req.body.title.trim();

  if (sourceTitle == '') {
    return null;
  }

  const newSource = {
    title: sourceTitle,
    date: req.getFormDataDate(),
    location: req.getFormDataLocation(),
    story: req.body.story,
  };

  return newSource;
};

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
