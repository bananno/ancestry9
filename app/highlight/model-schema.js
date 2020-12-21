module.exports = [
  {
    // Highlight text within this source.
    name: 'source',
    references: 'Source',
  },
  {
    // The text to be replaced with a link
    name: 'text',
    type: String,
  },
  {
    // Aka, the number of instances of the text to be skipped
    name: 'instance',
    type: Number,
    defaultValue: 0,
  },
  {
    // Highlighted text links to this person.
    name: 'linkPerson',
    references: 'Person',
  },
];
