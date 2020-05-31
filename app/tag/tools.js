const {
  Tag,
  modelRef,
} = require('../import');

const constants = require('./constants');
const tools = {};
module.exports = tools;

tools.convertParamTagId = (req, res, next, paramTagId) => {
  if (req.originalUrl.slice(0, 4) !== '/tag') {
    return next();
  }

  req.paramTagId = paramTagId;

  Tag.findById(paramTagId).populate('tags').exec((err, tag) => {
    if (!err && tag) {
      req.tagId = tag._id;
      req.tag = tag;
      return next();
    }

    const tryTitle = paramTagId.replace(/_/g, ' ').replace(/%20/g, ' ');

    Tag.findOne({title: tryTitle}).populate('tags').exec((err, tag) => {
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
  for (let i in constants.modelsThatHaveTags) {
    const modelName = constants.modelsThatHaveTags[i].name;
    const Model = modelRef[modelName];
    const pluralName = constants.modelsThatHaveTags[i].plural;
    await callback(Model, modelName, pluralName);
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

  const metatagTitles = tag.getTagTitles();

  if (metatagTitles.includes('group by value')) {
    data.groupByValue = {};
    data.values = {};
  }
  if (metatagTitles.includes('show missing items')) {
    data.missingItems = {};
  }

  await forEachModel(async (Model, modelName, pluralName) => {
    if (!tag.isModelAllowed(modelName)) {
      data[pluralName] = [];
      if (data.groupByValue) {
        data.values[pluralName] = [];
      }
      if (data.missingItems) {
        data.missingItems[pluralName] = [];
      }
      return;
    }

    if (pluralName === 'sources') {
      data[pluralName] = await Model.find({tags: tag._id}).populate('story');
    } else {
      data[pluralName] = await Model.find({tags: tag._id});
    }

    if (data.groupByValue) {
      const byValue = {};

      data[pluralName].forEach(item => {
        const tagValue = item.getTagValue(tag);
        byValue[tagValue] = byValue[tagValue] || [];
        byValue[tagValue].push(item);
      });

      data.groupByValue[pluralName] = byValue;
      data.values[pluralName] = Object.keys(byValue);
    }

    if (data.missingItems) {
      if (pluralName === 'sources') {
        data.missingItems[pluralName] = await Model
          .find({tags: {$nin: tag._id}})
          .populate('story');
      } else {
        data.missingItems[pluralName] = await Model
          .find({tags: {$nin: tag._id}});
      }
    }
  });

  return data;
};
