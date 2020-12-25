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
    // An excerpt of the original text that is larger than the actual link text.
    // Purpose is to provide context on the object's profile.
    // Can contain [paraphasing] and ... ellipses.
    // Length: anywhere between a few words and a paragraph.
    name: 'excerpt',
    type: String,
  },

  // Below: options for the "object" of the link.
  // Object can be absent.
  {
    // Highlighted text links to this person.
    name: 'linkPerson',
    references: 'Person',
  },
  {
    // Highlighted text links to this story.
    name: 'linkStory',
    references: 'Story',
  },
];
