// one-off: used to populate data on new machine

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

const database = {
  citations: require('../../database-backup/database-citations.json'),
  events: require('../../database-backup/database-events.json'),
  highlights: require('../../database-backup/database-highlights.json'),
  images: require('../../database-backup/database-images.json'),
  notations: require('../../database-backup/database-notations.json'),
  people: require('../../database-backup/database-people.json'),
  sources: require('../../database-backup/database-sources.json'),
  stories: require('../../database-backup/database-stories.json'),
  tags: require('../../database-backup/database-tags.json'),
}

async function populateDatabase() {
  await populateDatabaseModel(Person, database.people);
  await populateDatabaseModel(Story, database.stories);
  await populateDatabaseModel(Source, database.sources);
  await populateDatabaseModel(Event, database.events);
  await populateDatabaseModel(Highlight, database.highlights);
  await populateDatabaseModel(Image, database.images);
  await populateDatabaseModel(Notation, database.notations);
  await populateDatabaseModel(Tag, database.tags);
  await populateDatabaseModel(Citation, database.citations);
}

async function populateDatabaseModel(Model, items) {
  for (let i = 0; i < items.length; i++) {
    await Model.create(items[i]);
  }
}

module.exports = populateDatabase;