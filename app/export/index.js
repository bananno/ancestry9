const {
  mongoose, // remove
  Event,
} = require('../import');

const fs = require('fs');
const constants = require('./constants');
const {fields} = constants;
const getSharedData = require('./getSharedData');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/database', showDatabaseEverything);
  router.get('/sharing', exportSharedDatabase);
}

function showDatabaseEverything(req, res) {
  let data = {};
  new Promise(resolve => {
    resolve();
  }).then(() => {
    return saveFullDataFile(data, 'Person', 'people');
  }).then(() => {
    return saveFullDataFile(data, 'Story', 'stories');
  }).then(() => {
    return saveFullDataFile(data, 'Source', 'sources');
  }).then(() => {
    return saveFullDataFile(data, 'Event', 'events');
  }).then(() => {
    return saveFullDataFile(data, 'Citation', 'citations');
  }).then(() => {
    return saveFullDataFile(data, 'Notation', 'notations');
  }).then(() => {
    return saveFullDataFile(data, 'Image', 'images');
  }).then(() => {
    res.render('database', data);
  });
}

async function exportSharedDatabase(req, res) {
  const data = await getSharedData();

  await saveRawSharedDataFile('people', data.people, data);
  await saveRawSharedDataFile('stories', data.stories);
  await saveRawSharedDataFile('sources', data.sources);
  await saveRawSharedDataFile('events', data.events);
  await saveRawSharedDataFile('citations', data.citations);
  await saveRawSharedDataFile('notations', data.notations);

  res.redirect('/');
}

function saveFullDataFile(data, modelName, itemName) {
  return new Promise(resolve => {
    mongoose.model(modelName).find({}, (err, results) => resolve(results));
  }).then(results => {
    data[itemName] = results;
    const filename = 'database-backup/database-' + itemName + '.json';
    const content = stringifyData(data[itemName]);
    return new Promise(resolve => {
      fs.writeFile(filename, content, resolve);
    });
  });
}

function stringifyData(array) {
  return '[\n' + array.map(s => JSON.stringify(s)).join(',\n') + '\n]';
}

function saveRawSharedDataFile(attr, arr, data) {
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

function getStarterContent(data) {
  return (
    'const DATABASE = {};\n\n' +
    'DATABASE.countryList = ' + JSON.stringify(data.countryList) + ';\n\n'
  );
}
