const fields = {};

fields.event = [
  {name: 'title'},
  {name: 'date'},
  {name: 'location'},
  {name: 'people', multi: true},
  {name: 'notes'},
  {name: 'tags', multi: true},
];

fields.story = [
  {name: 'sharing', toggle: true},
  {name: 'type'},
  {name: 'group', onlyIf: story => story.group}, // can edit/remove but not add
  {name: 'title'},
  {name: 'date'},
  {name: 'location'},
  {name: 'people', multi: true},
  {name: 'links', multi: true},
  {name: 'images', multi: true},
  {name: 'tags', multi: true},
  {name: 'notes', inputType: 'textarea'},
  {name: 'summary', inputType: 'textarea'},
  {name: 'content', inputType: 'none'},
];

fields.source = [
  {name: 'sharing', toggle: true, preventSharing: source => !source.canBeShared()},
  {name: 'story'},
  {name: 'title'},
  {name: 'date', onlyIf: source => source.canHaveDate()},
  {name: 'location', onlyIf: source => source.canHaveLocation()},
  {name: 'people', multi: true},
  {name: 'links', multi: true},
  {name: 'images', multi: true},
  {name: 'tags', multi: true},
  {name: 'notes', inputType: 'textarea'},
  {name: 'summary', inputType: 'textarea'},
  {name: 'stories', multi: true},
  {name: 'content', inputType: 'none'},
];

module.exports = fields;
