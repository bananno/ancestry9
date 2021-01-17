module.exports = [
  {
    // Highlight belongs to this source and it points to text within this source.
    name: 'source',
    dataType: 'source',
  },
  {
    // The text to be replaced with a link; not case sensitive.
    name: 'text',
    dataType: String,
  },
  {
    // AKA, the number of instances of the text to be skipped.
    name: 'instance',
    dataType: Number,
    defaultValue: 0,
  },
  {
    // An excerpt of the original text that is larger than the actual link text.
    // Purpose is to provide context on the object's profile.
    // Can contain [paraphasing] and ... ellipses.
    // Length: anywhere between a few words and a paragraph.
    name: 'excerpt',
    dataType: String,
  },

  // Below: options for the "object" of the link.
  // Object can be absent.
  {
    // Highlighted text links to this person.
    name: 'linkPerson',
    dataType: 'person',
  },
  {
    // Highlighted text links to this story.
    name: 'linkStory',
    dataType: 'story',
  },
];
