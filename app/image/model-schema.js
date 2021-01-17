// Each image actually belongs to either a source or story, but this relationship
// is owned by the story.images array or source.images array.

module.exports = [
  {
    name: '_id',
    includeInSchema: false,
  },
  {
    name: 'url',
    dataType: String,
  },
  {
    name: 'tags',
    dataType: 'tag',
    isList: true,
  },
];
