const {
  Source,
} = require('../import');

const mainSourceTypes = [
  'document', 'index', 'cemetery', 'newspaper',
  'photo', 'website', 'book', 'other'
];

const sourceFields = [
  {name: 'sharing', toggle: true, preventSharing: source => !source.canBeShared()},
  {name: 'story'},
  {name: 'title'},
  {name: 'date', onlyIf: source => source.canHaveDate()},
  {name: 'location', onlyIf: source => source.canHaveLocation()},
  {name: 'people', multi: true},
  {name: 'links', multi: true},
  {name: 'images', multi: true},
  {name: 'tags', multi: true},
  {name: 'notes', fieldType: 'textarea'},
  {name: 'summary', fieldType: 'textarea'},
  {name: 'stories', multi: true},
];

module.exports = {
  mainSourceTypes,
  sourceFields,
  convertParamSourceId1,
  convertParamSourceId2,
  createRenderSource,
  getSourcesByType,
};

function createRenderSource(req, res, next) {
  res.renderSource = (subview, options = {}) => {
    const title = options.title ||
      [req.source.story.title, req.source.title].filter(Boolean).join(' - ');

    res.render('source/_layout', {
      subview,
      title,
      source: req.source,
      ...options
    });
  };
  next();
}

async function convertParamSourceId1(req, res, next, sourceId) { // :id
  if (req.originalUrl.slice(0, 7) === '/source') {
    req.sourceId = sourceId;
  }
  next();
}

async function convertParamSourceId2(req, res, next, sourceId) { // :sourceId
  req.sourceId = sourceId;
  next();
}

async function getSourcesByType(type) {
  const sources = await Source.find({}).populate('story');

  if (type == 'none') {
    return sources;
  }

  if (type == 'photo') {
    return sources.filter(source => source.story.title == 'Photo');
  }

  if (type == 'other') {
    return sources.filter(source => {
      let storyType = source.story.type.toLowerCase();
      return source.story.title != 'Photo'
        && storyType == 'other' || !mainSourceTypes.includes(storyType);
    });
  }

  return sources.filter(source => source.story.type.toLowerCase() == type);
}
