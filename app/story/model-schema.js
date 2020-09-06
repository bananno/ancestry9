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
    inputType: 'toggle',
  },
  {
    name: 'type',
    type: String,
    includeInExport: true,
  },
  {
    // phase out "group" attribute: can edit/remove, but not add
    name: 'group',
    type: String,
    onlyEditableIf: story => story.group,
  },
  {
    name: 'title',
    type: String,
    includeInExport: true,
  },
  {
    name: 'date',
    specialType: 'date',
    onlyEditableIf: story => story.canHaveDate(),
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
    includeInExport: true,
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
    name: 'content',
    type: String,
    includeInExport: true,
    // phase out "inputType=none", use "showInEditTable=false" instead
    // showInEditTable: false,
    inputType: 'none',
  },
];
