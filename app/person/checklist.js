const {
  Source,
} = require('../import');

module.exports = renderPersonChecklist;

async function renderPersonChecklist(req, res) {
  const person = req.person;

  await person.populateBirthAndDeath();
  const birthYear = person.getBirthYear();
  const deathYear = person.getDeathYear();

  const sources = await Source.find({people: person}).populate('story');

  res.renderPersonProfile('checklist', {
    checklistSections: [
      {
        title: 'Links',
        items: createLinkChecklist(person.links)
      },
      {
        title: 'Relatives',
        items: createRelativesChecklist(person)
      },
      {
        title: 'Life',
        items: createLifeEventsChecklist(birthYear, deathYear)
      },
      {
        title: 'Sources',
        items: createSourceChecklist(sources, person, birthYear, deathYear)
      },
    ],
    incompleteSourceList: createIncompleteSourceList(sources),
  });
}

function createLinkChecklist(links) {
  const linksRef = {
    Ancestry: {},
    FamilySearch: {},
    FindAGrave: {strikeLiving: true},
    Lundberg: {strikeLiving: true},
    WikiTree: {},
  };

  links.forEach(url => {
    if (url.match('lundbergancestry')) {
      linksRef.Lundberg.complete = true;
    } else if (url.match('ancestry.com')) {
      linksRef.Ancestry.complete = true;
    } else if (url.match('familysearch.org')) {
      linksRef.FamilySearch.complete = true;
    } else if (url.match('findagrave')) {
      linksRef.FindAGrave.complete = true;
    } else if (url.match('wikitree')) {
      linksRef.WikiTree.complete = true;
    }
  });

  return Object.keys(linksRef).map(key => {
    return {...linksRef[key], title: key};
  });
}

function createRelativesChecklist(person) {
  return [
    {title: 'parent 1', complete: person.parents.length >= 1},
    {title: 'parent 2', complete: person.parents.length >= 2},
  ];
}

function createLifeEventsChecklist(birthYear, deathYear) {
  return [
    {
      title: 'birth date',
      complete: !!birthYear
    },
    {
      title: 'death date',
      complete: !!deathYear,
      strikeLiving: true
    }
  ];
}

function createSourceChecklist(sources, person, birthYear, deathYear) {
  const sourceChecklist = [];

  const checkForStory = (attr, title, strikeLiving) => {
    const foundSource = !!sources.find(source => source.story[attr] === title);

    sourceChecklist.push({
      complete: foundSource,
      strikeLiving,
      title,
    });
  };

  checkForStory('type', 'cemetery', true);

  for (let year = 1840; year <= 1940; year += 10) {
    if (birthYear && birthYear > year) {
      continue;
    }

    if (!deathYear) {
      if (birthYear && year - birthYear > 90) {
        continue;
      }
    } else if (deathYear < year) {
      continue;
    }

    checkForStory('title', 'Census USA ' + year);
  }

  if (birthYear != null && deathYear != null && person.gender != 1) {
    if (birthYear < 1900 && deathYear > 1917) {
      checkForStory('title', 'World War I draft');
    }
    if (birthYear < 1925 && deathYear > 1940) {
      checkForStory('title', 'World War II draft');
    }
  }

  return sourceChecklist;
}

function createIncompleteSourceList(sourceList) {
  const list = [];

  sourceList.forEach(source => {
    const missingContent = source.content == null || source.content == '';
    const missingImage = source.images.length == 0;
    const missingSummary = (source.summary || '').length == 0;
    const isCensus = source.story.type == 'document'
      && source.story.title.match('Census');

    const missing = [];

    if (missingContent) {
      missing.push('transcription');
    }
    if (missingImage && source.story.type != 'book') {
      missing.push('image');
    }
    if (missingSummary && (isCensus || source.story.type == 'newspaper')) {
      missing.push('summary');
    }

    if (missing.length) {
      let text1;

      if (source.story.type == 'newspaper') {
        text1 = 'newspaper article: ' + source.title;
      } else if (source.story.type == 'cemetery' || isCensus) {
        text1 = source.story.title;
      } else if (source.story.type == 'book') {
        text1 = source.story.title + ' - ' + source.title;
      } else {
        return;
      }

      list.push([source, text1, missing.join(', ')]);
    }
  });

  return list;
}
