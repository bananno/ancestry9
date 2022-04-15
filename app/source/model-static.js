const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const methods = {};
module.exports = methods;

methods.findObituaries = async () => {
  const obituariesCollection = await mongoose.model('Story').find({title: /obituaries/i});

  // the title contains the word "obituary" OR it is linked to the obituaries collection
  const sourceFilter = {
    $or: [
      {stories: obituariesCollection},
      {title: {$regex: /obituary/gi}},
    ],
  };

  return await mongoose.model('Source').find(sourceFilter).populate('people');
};

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

methods.sortByStoryYear = sources => {
  tools.sortBy(sources, source => source.story.date.year);
};
