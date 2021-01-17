module.exports = [
  {
    // _id should be included in the export; that's the only reason it is in this list
    name: '_id',
    includeInSchema: false,
  },
  {
    name: 'title',
    dataType: String,
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
    name: 'notes',
    dataType: String,
    inputType: 'textarea',
  },
  {
    name: 'tags',
    dataType: 'tag',
    isList: true,
    includeInExport: false,
  },
];
