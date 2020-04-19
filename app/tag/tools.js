const {
  Event,
  Image,
  Notation,
  Person,
  Story,
  Source,
} = require('../import');

module.exports = {
  getTagIndexData,
  getTagShowData,
};

async function forEachModel(callback) {
  const modelsWithTags = [Event, Image, Person, Story, Source, Notation];
  const modelNames = ['events', 'images', 'people', 'stories', 'sources', 'notations'];

  for (let i in modelsWithTags) {
    await callback(modelsWithTags[i], modelNames[i]);
  }
}

async function getTagIndexData() {
  const tagRef = {};

  await forEachModel(async Model => {
    const items = await Model.find({});

    items.forEach(item => {
      item.tags.forEach(rawTagName => {
        const tagName = rawTagName.split('=')[0].trim();
        findTag(tagName).count += 1;
      });
    });
  });

  const definitions = await Notation.find({tags: 'tag definition'});
  definitions.forEach(notation => {
    const tagName = notation.title || 'ERROR: NOTATION MISSING TITLE';
    findTag(tagName).definition = notation.text;
  });

  const tagNameList = Object.keys(tagRef).sort();

  return tagNameList.map(tagName => tagRef[tagName]);

  function findTag(tagName) {
    if (!tagRef[tagName]) {
      tagRef[tagName] = {
        name: tagName,
        count: 0,
        path: '/tag/' + tagName.split(' ').join('_')
      };
    }
    return tagRef[tagName];
  }
}

async function getTagShowData(tagName) {
  const data = {};

  await forEachModel(async (Model, modelName) => {
    const items = modelName === 'sources'
      ? await Model.find({})
      : await Model.find({}).populate('story');

    data[modelName] = items.filter(item => {
      return item.tags.map(tag => tag.split('=')[0].trim()).includes(tagName);
    });
  });

  return data;
}
