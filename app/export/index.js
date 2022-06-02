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
  router.get('/database', exportAndRenderEverything);
  router.get('/sharing', exportSharedData);
}

async function exportAndRenderEverything(req, res) {
  const data = await getFullData();

  await saveFullDataFile(data, 'citations');
  await saveFullDataFile(data, 'events');
  await saveFullDataFile(data, 'highlights');
  await saveFullDataFile(data, 'images');
  await saveFullDataFile(data, 'notations');
  await saveFullDataFile(data, 'people');
  await saveFullDataFile(data, 'sources');
  await saveFullDataFile(data, 'stories');
  await saveFullDataFile(data, 'tags');

  res.render('export/index', data);
}

async function exportSharedData(req, res) {
  const data = await getSharedData();

  await saveSharedDataFile('people', data.people, data);
  await saveSharedDataFile('stories', data.stories);
  await saveSharedDataFile('sources', data.sources);
  await saveSharedDataFile('events', data.events);
  await saveSharedDataFile('citations', data.citations);
  await saveSharedDataFile('notations', data.notations);

  res.redirect('/');
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
  const filename = 'database-backup/database-' + itemName + '.json';
  const content = stringifyData(itemData);
  return new Promise(resolve => {
    fs.writeFile(filename, content, resolve);
  });
}

function saveSharedDataFile(attr, arr, data) {
  const filename = 'shared/database/raw-' + attr + '.js';

  const content = (
    (data ? getStarterContent(data) : '') +
    'DATABASE.' + attr + ' = [\n' +
      arr.map(item => '  ' + JSON.stringify(item) + ',').join('\n') +
    '\n];\n'
  );

  return new Promise(resolve => {
    fs.writeFile(filename, content, resolve);
  });
}

function stringifyData(array) {
  return '[\n' + array.map(s => JSON.stringify(s)).join(',\n') + '\n]';
}

function getStarterContent(data) {
  return (
    'const DATABASE = {};\n\n' +
    'DATABASE.countryList = ' + JSON.stringify(data.countryList) + ';\n\n'
  );
}
