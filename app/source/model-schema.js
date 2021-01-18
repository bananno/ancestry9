module.exports = [
  {
    name: '_id',
    includeInSchema: false,
  },
  {
    name: 'sharing',
    dataType: Boolean,
    defaultValue: false,
    isEditable: source => source.sharing || source.canBeShared(),
    showDisabledWhenNotEditable: true,
  },
  {
    name: 'story',
    dataType: 'story',
  },
  {
    name: 'title',
    dataType: String,
  },
  {
    name: 'date',
    dataType: 'date',
    isEditable: source => source.canHaveDate(),
  },
  {
    name: 'location',
    dataType: 'location',
    isEditable: source => source.canHaveLocation(),
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
    includeInExport: false,
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
    name: 'stories',
    dataType: 'story',
    isList: true,
  },
  {
    name: 'content',
    dataType: String,
    isEditable: false,
  },
];
