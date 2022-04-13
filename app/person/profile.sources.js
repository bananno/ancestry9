const {
  Citation,
  Highlight,
  Source,
} = require('../import');

module.exports = renderPersonSources;

const groupTitleMap = {cemetery: 'grave', index: 'web index'};

async function renderPersonSources(req, res) {
  const person = req.person;
  const subview = req.params.subview;

  let sources = await Source.find({people: person})
    .populate('story').populate('images');

  Source.sortByStory(sources);

  sources = filterSourcesForSubview(subview, sources);

  let previousSourceType;
  const sourceItems = [];

  for (let i in sources) {
    const source = sources[i];
    await source.populatePersonCitations(person);
    source.highlights = await Highlight.find({linkPerson: person, source});
    Citation.sortByItem(source.citations);

    let groupTitle;
    if (source.story.type !== previousSourceType) {
      groupTitle = groupTitleMap[source.story.type] || (source.story.type + 's');
      previousSourceType = source.story.type;
    }

    sourceItems.push({groupTitle, source});
  }

  res.renderPersonProfile('sources', {
    showGroupTitles: !subview || subview === 'other',
    sourceItems,
  });
}

function filterSourcesForSubview(subview, sources) {
  if (!subview) {
    return sources;
  }
  if (subview === 'grave') {
    return sources.filter(source => source.story.type === 'cemetery');
  }
  if (subview === 'newspapers') {
    return sources.filter(source => source.story.type === 'newspaper');
  }
  if (subview === 'documents') {
    return sources.filter(source => source.story.type === 'document' &&
      !source.story.title.match(/census/i));
  }
  if (subview === 'census') {
    return sources.filter(source => source.story.title.match(/census/i));
  }
  return sources.filter(source => !['cemetery', 'document', 'newspaper']
    .includes(source.story.type));
}
