const fields = {
  personEveryone: [
    '_id', 'parents', 'spouses', 'children',
  ],
  personShared: [
    'name', 'customId', 'links', 'profileImage', 'gender',
  ],
  story: [
    '_id', 'type', 'title', 'date', 'location', 'people',
    'links', 'images', 'content', 'notes', 'summary',
  ],
  source: [
    '_id', 'title', 'date', 'location', 'people',
    'links', 'images', 'content', 'notes', 'summary', 'story', 'stories'
  ],
  event: [
    '_id', 'title', 'date', 'location', 'people', 'notes'
  ],
  notation: [
    '_id', 'title', 'people', 'text', 'tags', 'source', 'stories',
    'date', 'location'
  ],
  image: [
    '_id', 'url', 'tags'
  ],
};

module.exports = {
  fields,
};
