const constants = require('./constants');

module.exports = {
  createRenderStory,
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
      rootPath: '/story/' + story._id,
      ...options
    });
  };
  next();
}
