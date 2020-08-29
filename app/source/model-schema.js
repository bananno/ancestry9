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
    inputType: 'toggle',
    defaultValue: false,
    onlyEditableIf: source => source.sharing || source.canBeShared(),
    showDisabledWhenNotEditable: true,
  },
  {
    name: 'story',
    references: 'Story',
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
    onlyEditableIf: source => source.canHaveDate(),
    includeInExport: true,
  },
  {
    name: 'location',
    specialType: 'location',
    onlyEditableIf: source => source.canHaveLocation(),
    includeInExport: true,
  },
  {
    name: 'people',
    references: 'Person',
    isArray: true,
    includeInExport: true,
  },
  {
    name: 'links',
    type: String,
    isArray: true,
    includeInExport: true,
  },
  {
    name: 'images',
    references: 'Image',
    isArray: true,
    includeInExport: true,
  },
  {
    name: 'tags',
    specialType: 'tags',
    references: 'Tag',
    isArray: true,
  },
  {
    name: 'notes',
    type: String,
    inputType: 'textarea',
    includeInExport: true,
  },
  {
    name: 'summary',
    type: String,
    inputType: 'textarea',
    includeInExport: true,
  },
  {
    name: 'stories',
    references: 'Story',
    isArray: true,
    includeInExport: true,
  },
  {
    name: 'content',
    type: String,
    inputType: 'none',
    includeInExport: true,
  },
];
