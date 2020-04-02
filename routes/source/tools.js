const {
  Person,
  Source,
  sortPeople,
} = require('../import');

const mainSourceTypes = [
  'document', 'index', 'cemetery', 'newspaper',
  'photo', 'website', 'book', 'other'
];

module.exports = {
  mainSourceTypes,
  convertParamSourceId1,
  convertParamSourceId2,
  createRenderSource,
  getSourcesByType,
  sortPeopleForNewCitations,
};

function createRenderSource(req, res, next) {
  res.renderSource = (subview, options = {}) => {
    const title = options.title ||
      [req.source.story.title, req.source.title].filter(Boolean).join(' - ');

    res.render('source/_layout', {
      subview,
      title,
      source: req.source,
      ...options
    });
  };
  next();
}

async function convertParamSourceId1(req, res, next, sourceId) { // :id
  if (req.originalUrl.slice(0, 7) === '/source') {
    req.sourceId = sourceId;
  }
  next();
}

async function convertParamSourceId2(req, res, next, sourceId) { // :sourceId
  req.sourceId = sourceId;
  next();
}

async function getSourcesByType(type) {
  const sources = await Source.find({}).populate('story');

  if (type == 'none') {
    return sources;
  }

  if (type == 'photo') {
    return sources.filter(source => source.story.title == 'Photo');
  }

  if (type == 'other') {
    return sources.filter(source => {
      let storyType = source.story.type.toLowerCase();
      return source.story.title != 'Photo'
        && storyType == 'other' || !mainSourceTypes.includes(storyType);
    });
  }

  return sources.filter(source => source.story.type.toLowerCase() == type);
}

function sortPeopleForNewCitations(source, people, citations) {
  source.people.forEach(thisPerson => {
    people = Person.removeFromList(people, thisPerson);
  });

  sortPeople(people, 'name');

  const citationsPeople = [];
  const tempPeople = source.people.map(person => '' + person._id);
  citations.forEach(citation => {
    if (!tempPeople.includes('' + citation.person._id)) {
      tempPeople.push('' + citation.person._id);
      citationsPeople.push(citation.person);
      people = Person.removeFromList(people, citation.person);
    }
  });

  return [...source.people, ...citationsPeople, ...people];
}
