const {
  Citation,
  Highlight,
  sorting,
  Source,
} = require('../import');

module.exports = renderPersonSources;

const groupTitleMap = {cemetery: 'grave', index: 'web index'};

async function renderPersonSources(req, res) {
  const person = req.person;
  const subview = req.params.subview;

  let sources = await Source.find({people: person})
    .populate('story').populate('images');

  sources = filterSourcesForSubview(subview, sources);

  let checklistItems, previousSourceType;
  const sourceItems = [];

  if (subview === 'census') {
    Source.sortByStoryYear(sources);
    checklistItems = await getCensusChecklist(person, sources);
  } else {
    Source.sortByStory(sources);
  }

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

  let mentions;
  if (subview === 'newspapers') {
    await req.person.populateHighlightMentions();
    mentions = req.person.mentions.filter(highlight => {
      const highlightSourceId = `${highlight.source._id}`;
      return highlight.source.story.type === 'newspaper' &&
        sources.every(source => `${source._id}` !== highlightSourceId);
    });
  }

  res.renderPersonProfile('sources', {
    checklistItems,
    mentions,
    showGroupTitles: !subview || subview === 'other',
    sourceItems,
    pageTitle: subview ? `Sources - ${subview}` : 'Sources',
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

async function getCensusChecklist(person, sources) {
  await person.populateBirthAndDeath();
  const birthYear = person.getBirthYear();
  const deathYear = person.getDeathYear();
  const immigrationYear = await person.getImmigrationYear();
  const listItems = [];

  for (let year = 1840; year <= 1950; year += 10) {
    if (birthYear > year || immigrationYear > year) {
      continue;
    }
    if (!deathYear) {
      if (birthYear && year - birthYear > 90) {
        continue;
      }
    } else if (deathYear < year) {
      continue;
    }

    const result = {
      complete: sources.some(source => source.story.date.year === year),
      title: `Census USA ${year}`,
      year,
    };

    if (!result.complete && year === 1890) {
      result.strike = true;
      result.note = 'not found; probably destroyed';
    }

    listItems.push(result);
  }

  sources.forEach(source => {
    if (!source.story.title.match('Census USA')) {
      listItems.push({
        complete: true,
        title: source.story.title,
        year: source.story.date.year,
      });
    }
  });

  sorting.sortBy(listItems, item => item.year);

  return listItems;
}
