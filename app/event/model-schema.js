module.exports = [
  {
    // _id should be included in the export; that's the only reason it is in this list
    name: '_id',
    includeInSchema: false,
    showInEditTable: false,
    includeInExport: true,
  },
  {
    name: 'title',
    type: String,
    includeInExport: true,
  },
  {
    name: 'date',
    specialType: 'date',
    includeInExport: true,
  },
  {
    name: 'location',
    specialType: 'location',
    includeInExport: true,
  },
  {
    name: 'people',
    references: 'Person',
    isArray: true,
    includeInExport: true,
  },
  {
    name: 'notes',
    type: String,
    includeInExport: true,
  },
  {
    name: 'tags',
    specialType: 'tags',
    references: 'Tag',
    isArray: true,
  },
];
