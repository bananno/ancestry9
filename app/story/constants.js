const constants = {};
module.exports = constants;

constants.fieldNames = [
  '_id', 'type', 'title', 'date', 'location', 'people',
  'links', 'images', 'content', 'notes', 'summary',
];

constants.mainStoryTypes = [
  'book', 'cemetery', 'document', 'index',
  'newspaper', 'website', 'place', 'topic'
];

constants.noEntryStoryTypes = [
  'artifact', 'event', 'landmark', 'place'
];

constants.fields = [
  {name: 'sharing', toggle: true},
  {name: 'type'},
  {name: 'group', onlyIf: story => story.group}, // can edit/remove but not add
  {name: 'title'},
  {name: 'date'},
  {name: 'location'},
  {name: 'people', multi: true},
  {name: 'links', multi: true},
  {name: 'images', multi: true},
  {name: 'tags', multi: true},
  {name: 'notes', inputType: 'textarea'},
  {name: 'summary', inputType: 'textarea'},
  {name: 'content', inputType: 'none'},
];
