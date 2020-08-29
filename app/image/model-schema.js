// Each image actually belongs to either a source or story, but this relationship
// is owned by the story.images array or source.images array.

module.exports = [
  {
    // _id should be included in the export; that's the only reason it is in this list
    name: '_id',
    includeInSchema: false,
    showInEditTable: false,
    includeInExport: true,
  },
  {
    name: 'url',
    type: String,
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
