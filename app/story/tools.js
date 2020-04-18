const constants = require('./constants');

module.exports = {
  createRenderStory,
};

function createRenderStory(req, res, next) {
  res.renderStory = (subview, options = {}) => {
    const story = req.story;
    res.render('story/_layout', {
      subview,
      title: story.title,
      story,
      rootPath: '/story/' + story._id,
      canHaveDate: story.type != 'cemetery',
      canHaveEntries: !constants.noEntryStoryTypes.includes(story.type),
      ...options
    });
  };
  next();
}
