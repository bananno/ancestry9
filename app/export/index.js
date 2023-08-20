const {
  Citation,
  Event,
  Highlight,
  Image,
  Notation,
  Person,
  Source,
  Story,
  Tag,
} = require('../import');

const fs = require('fs');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/api/export/full', exportDatabaseBackup);
  router.get('/api/export/publish', exportPublishedData);
}

async function exportDatabaseBackup(req, res) {
  const data = await getFullData();

  await Promise.all([
    saveFullDataFile(data, 'citations'),
    saveFullDataFile(data, 'events'),
    saveFullDataFile(data, 'highlights'),
    saveFullDataFile(data, 'images'),
    saveFullDataFile(data, 'notations'),
    saveFullDataFile(data, 'people'),
    saveFullDataFile(data, 'sources'),
    saveFullDataFile(data, 'stories'),
    saveFullDataFile(data, 'tags'),
  ]);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({});
}

async function exportPublishedData(req, res) {
  const data = await getSharedData();

  if (!fs.existsSync('client/db')) {
    fs.mkdirSync('client/db');
  }

  await Promise.all([
    savePublishedDataFile('people', data.people),
    savePublishedDataFile('stories', data.stories),
    savePublishedDataFile('sources', data.sources),
    savePublishedDataFile('events', data.events),
    savePublishedDataFile('citations', data.citations),
    savePublishedDataFile('notations', data.notations),
    savePublishedDataFile('countries', data.countryList),
  ]);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send({});
}

async function getFullData() {
  const data = {};

  data.citations = await Citation.find({});
  data.events = await Event.find({});
  data.highlights = await Highlight.find({});
  data.images = await Image.find({});
  data.notations = await Notation.find({});
  data.people = await Person.find({});
  data.sources = await Source.find({});
  data.stories = await Story.find({});
  data.tags = await Tag.find({});

  return data;
}

async function getSharedData() {
  const data = {};

  const images = await Image.find({}).populate('tags');
  const imageMap = {};
  images.forEach(image => imageMap[image._id] = image);

  data.citations = await Citation.getAllSharedData();
  data.events = await Event.getAllSharedData();
  data.notations = await Notation.getAllSharedData();
  data.people = await Person.getAllSharedData();
  data.stories = await Story.getAllSharedData(imageMap);
  data.sources = await Source.getAllSharedData(imageMap);
  data.countryList = Person.getAllCountriesOfOrigin(data.people);

  return data;
}

function saveFullDataFile(data, itemName) {
  const itemData = data[itemName];
  const filename = `database-backup/database-${itemName}.json`;
  const content = stringifyData(itemData);

  // fs.writeFile does not return a promise
  return new Promise(resolve => {
    fs.writeFile(filename, content, resolve);
  });
}

function savePublishedDataFile(attr, arr) {
  const filename = `client/db/${attr}.json`;
  const stringifiedItems = arr.map(item => JSON.stringify(item));
  const content = `[\n  ${stringifiedItems.join(',\n  ')}\n]\n`;

  // fs.writeFile does not return a promise
  return new Promise(resolve => {
    fs.writeFile(filename, content, resolve);
  });
}

function stringifyData(array) {
  return '[\n' + array.map(s => JSON.stringify(s)).join(',\n') + '\n]';
}
