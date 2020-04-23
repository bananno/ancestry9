const constants = {};
module.exports = constants;

constants.fieldNamesEveryone = [
  '_id', 'parents', 'spouses', 'children',
];

constants.fieldNamesShared = [
  'name', 'customId', 'links', 'profileImage', 'gender',
];

constants.fields = [
  {name: 'name'},
  {name: 'customId'},
  {name: 'shareLevel', toggle: true, getValue: person => person.sharing.level},
  {name: 'shareName', onlyIf: person => person.sharing.level === 1},
  {name: 'profileImage'},
  {name: 'gender'},
  {name: 'parents', multi: true, dataType: 'people', corresponding: 'children'},
  {name: 'spouses', multi: true, dataType: 'people', corresponding: 'spouses'},
  {name: 'children', multi: true, dataType: 'people', corresponding: 'parents'},
  {name: 'links', multi: true},
  {name: 'tags', multi: true},
];
