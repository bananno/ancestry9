module.exports = [
  {
    // _id should be included in the export; that's the only reason it is in this list
    name: '_id',
    includeInSchema: false,
    showInEditTable: false,
    includeInExport: true,
  },
  {
    name: 'sharing',
    type: Boolean,
    defaultValue: false,
    toggle: true,
  },
  {
    name: 'title',
    type: String,
    includeInExport: true,
  },
  {
    name: 'source',
    references: 'Source',
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
    name: 'stories',
    references: 'Story',
    isArray: true,
    includeInExport: true,
  },
  {
    name: 'text',
    type: String,
    inputType: 'textarea',
    includeInExport: true,
  },
  {
    name: 'tags',
    specialType: 'tags',
    references: 'Tag',
    isArray: true,
    includeInExport: true,
  },
];
