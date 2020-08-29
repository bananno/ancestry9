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
  {
    name: 'shareLevel',
    toggle: true,
    maxValue: 2,
  },
  {name: 'shareName', onlyIf: person => person.shareLevel === 1},
  {name: 'profileImage'},
  {name: 'gender'},
  {
    name: 'parents',
    multi: true,
    dataType: 'people',
    onAdd: (person, relativeId) => person.attachParent(relativeId),
    onDelete: (person, relativeId) => person.detachParent(relativeId),
  },
  {
    name: 'spouses',
    multi: true,
    dataType: 'people',
    onAdd: (person, relativeId) => person.attachSpouse(relativeId),
    onDelete: (person, relativeId) => person.detachSpouse(relativeId),
  },
  {
    name: 'children',
    multi: true,
    dataType: 'people',
    onAdd: (person, relativeId) => person.attachChild(relativeId),
    onDelete: (person, relativeId) => person.detachChild(relativeId),
  },
  {name: 'links', multi: true},
  {name: 'tags', multi: true},
];
