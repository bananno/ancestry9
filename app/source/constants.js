const constants = {};
module.exports = constants;

constants.fieldNames = [
  '_id', 'title', 'date', 'location', 'people',
  'links', 'images', 'content', 'notes', 'summary', 'story', 'stories'
];

constants.mainSourceTypes = [
  'document', 'index', 'cemetery', 'newspaper',
  'photo', 'website', 'book', 'other'
];

constants.fields = [
  {name: 'sharing', toggle: true, preventSharing: source => !source.canBeShared()},
  {name: 'story'},
  {name: 'title'},
  {name: 'date', onlyIf: source => source.canHaveDate()},
  {name: 'location', onlyIf: source => source.canHaveLocation()},
  {name: 'people', multi: true},
  {name: 'links', multi: true},
  {name: 'images', multi: true},
  {name: 'tags', multi: true},
  {name: 'notes', inputType: 'textarea'},
  {name: 'summary', inputType: 'textarea'},
  {name: 'stories', multi: true},
  {name: 'content', inputType: 'none'},
];
