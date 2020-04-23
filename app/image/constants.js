const constants = {};
module.exports = constants;

constants.fieldNames = [
  '_id', 'url', 'tags'
];

constants.fields = [
  {name: 'url'},
  {name: 'tags', multi: true},
];
