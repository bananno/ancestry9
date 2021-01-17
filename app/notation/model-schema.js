module.exports = [
  {
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
    name: 'title',
    dataType: String,
  },
  {
    // Notation may belong to a source.
    name: 'source',
    dataType: 'source',
  },
  {
    name: 'date',
    dataType: 'date',
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
    name: 'stories',
    dataType: 'story',
    isList: true,
  },
  {
    name: 'text',
    dataType: String,
    inputType: 'textarea',
  },
  {
    name: 'tags',
    dataType: 'tag',
    isList: true,
  },
];
