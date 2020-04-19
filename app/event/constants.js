const constants = {};
module.exports = constants;

constants.fieldNames = [
  '_id', 'title', 'date', 'location', 'people', 'notes'
];

constants.eventFields = [
  {name: 'title'},
  {name: 'date'},
  {name: 'location'},
  {name: 'people', multi: true},
  {name: 'notes'},
  {name: 'tags', multi: true},
];
