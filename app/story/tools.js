const {
  Story,
} = require('../import');

const constants = require('./constants');

module.exports = {
  createRenderStory,
  getShowStoryInfo,
};

function createRenderStory(req, res, next) {
  res.renderStory = async (subview, options = {}) => {
    const story = req.story;
    if (!story.entries) {
      await story.populateEntries();
    }
    res.render('story/_layout', {
      subview,
      title: story.title,
      story,
      rootPath: req.rootPath || '/story/' + story._id,
      ...options
    });
  };
  next();
}

async function getShowStoryInfo(story) {
  const data = {};

  if (story.type === 'place') {
    data.storiesInLocation = await Story.find({
      type: {$in: ['cemetery', 'landmark', 'newspaper']},
      location: story.location,
    });
  }

  return data;
}
