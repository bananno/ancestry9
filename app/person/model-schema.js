module.exports = [
  {
    name: 'name',
    type: String,
  },
  {
    name: 'customId',
    type: String,
  },
  {
    name: 'shareLevel',
    type: Number,
    inputType: 'toggle',
    maxValue: 2,
    defaultValue: 0,
    valueNames: ['none (0)', 'restricted (1)', 'everything (2)'],
  },
  {
    name: 'shareName',
    type: String,
    onlyEditableIf: person => person.shareLevel === 1,
  },
  {
    // Just a detail; no need for a real "image" object.
    name: 'profileImage',
    type: String,
  },
  {
    // 1 = female, 2 = male, 3 = unknown
    // (or 0 = not yet specified in database)
    name: 'gender',
    type: Number,
  },
  {
    name: 'parents',
    references: 'Person',
    isArray: true,
    onAdd: (person, relativeId) => person.attachParent(relativeId),
    onDelete: (person, relativeId) => person.detachParent(relativeId),
  },
  {
    name: 'spouses',
    references: 'Person',
    isArray: true,
    onAdd: (person, relativeId) => person.attachSpouse(relativeId),
    onDelete: (person, relativeId) => person.detachSpouse(relativeId),
  },
  {
    name: 'children',
    references: 'Person',
    isArray: true,
    onAdd: (person, relativeId) => person.attachChild(relativeId),
    onDelete: (person, relativeId) => person.detachChild(relativeId),
  },
  {
    name: 'links',
    type: String,
    isArray: true,
  },
  {
    name: 'tags',
    specialType: 'tags',
    references: 'Tag',
    isArray: true,
  },
];
