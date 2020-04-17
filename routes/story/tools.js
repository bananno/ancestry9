const {
  modelFields,
} = require('../import');

const mainStoryTypes = [
  'book', 'cemetery', 'document', 'index',
  'newspaper', 'website', 'place', 'topic'
];

const noEntryStoryTypes = ['artifact', 'event', 'landmark', 'place'];

module.exports = {
  mainStoryTypes,
  storyFields: modelFields.story,
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
      canHaveEntries: !noEntryStoryTypes.includes(story.type),
      ...options
    });
  };
  next();
}
