const constants = {};
module.exports = constants;

constants.fieldNames = [
  '_id', 'title', 'people', 'text', 'tags', 'source', 'stories',
  'date', 'location'
];

constants.fields = [
  {name: 'sharing', toggle: true},
  {name: 'title'},
  {name: 'source'},
  {name: 'date'},
  {name: 'location'},
  {name: 'people', multi: true},
  {name: 'stories', multi: true},
  {name: 'text', inputType: 'textarea'},
  {name: 'tags', multi: true},
];
