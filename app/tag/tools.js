const {
  Event,
  Image,
  Notation,
  Person,
  Story,
  Source,
  Tag,
} = require('../import');

const tools = {};
module.exports = tools;

tools.convertParamTagId = (req, res, next, paramTagId) => {
  if (req.originalUrl.slice(0, 4) !== '/tag') {
    return next();
  }

  req.paramTagId = paramTagId;

  Tag.findById(paramTagId, (err, tag) => {
    if (!err && tag) {
      req.tagId = tag._id;
      req.tag = tag;
      return next();
    }

    const tryTitle = paramTagId.replace(/_/g, ' ').replace(/%20/g, ' ');

    Tag.findOne({title: tryTitle}, (err, tag) => {
      if (!err && tag) {
        req.tagId = tag._id;
        req.tag = tag;
        return next();
      }

      res.send('tag not found');
    });
  });
}

tools.createRenderTag = function(req, res, next) {
  res.renderTag = async (subview, options = {}) => {
    res.render('tag/_layout', {
      subview,
      tag: req.tag,
      title: 'Tag: ' + req.tag.title,
      rootPath: '/tag/' + req.tag._id,
      ...options
    });
  };
  next();
};

async function forEachModel(callback) {
  const modelsWithTags = [Event, Image, Person, Story, Source, Notation];
  const modelNames = ['events', 'images', 'people', 'stories', 'sources', 'notations'];

  for (let i in modelsWithTags) {
    await callback(modelsWithTags[i], modelNames[i]);
  }
}

tools.getTagIndexData = async tags => {
  const tagRef = {};

  tags.forEach(tag => {
    tag.count = 0;
    tagRef[tag._id] = tag;
  });

  await forEachModel(async Model => {
    const items = await Model.find({});

    items.forEach(item => {
      item.tags.forEach(tagId => {
        tagRef[tagId].count += 1;
      });
    });
  });
};

tools.getTagShowData = async function(tag) {
  const data = {};

  await forEachModel(async (Model, modelName) => {
    const items = modelName === 'sources'
      ? await Model.find({}).populate('story')
      : await Model.find({});

    data[modelName] = items.filter(item => item.tags.includes(tag._id));
  });

  return data;
};
