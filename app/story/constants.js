const fieldNames = [
  '_id', 'type', 'title', 'date', 'location', 'people',
  'links', 'images', 'content', 'notes', 'summary',
];

const mainStoryTypes = [
  'book', 'cemetery', 'document', 'index',
  'newspaper', 'website', 'place', 'topic'
];

const noEntryStoryTypes = [
  'artifact', 'event', 'landmark', 'place'
];

module.exports = {
  fieldNames,
  mainStoryTypes,
  noEntryStoryTypes,
};
