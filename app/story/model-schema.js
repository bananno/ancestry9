module.exports = [
  {
    // _id should be included in the export; that's the only reason it is in this list
    name: '_id',
    includeInSchema: false,
  },
  {
    name: 'sharing',
    dataType: Boolean,
    defaultValue: false,
    includeInExport: false,
  },
  {
    name: 'type',
    dataType: String,
  },
  {
    // phase out "group" attribute: can edit/remove, but not add
    name: 'group',
    dataType: String,
    isEditable: story => story.group,
    includeInExport: false,
  },
  {
    name: 'title',
    dataType: String,
  },
  {
    name: 'date',
    dataType: 'date',
    isEditable: story => story.canHaveDate(),
  },
  {
    name: 'location',
    dataType: 'location',
  },
  {
    name: 'people',
    dataType: 'person',
    isList: true,
  },
  {
    name: 'links',
    dataType: 'link',
    isList: true,
  },
  {
    name: 'images',
    dataType: 'image',
    isList: true,
  },
  {
    name: 'tags',
    dataType: 'tag',
    isList: true,
  },
  {
    name: 'notes',
    dataType: String,
    inputType: 'textarea',
  },
  {
    name: 'summary',
    dataType: String,
    inputType: 'textarea',
  },
  {
    name: 'content',
    dataType: String,
    isEditable: false,
  },
];
