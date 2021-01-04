const {
  Person,
  Source,
} = require('../import');

module.exports = renderPersonChecklist;

async function renderPersonChecklist(req, res) {
  const person = await Person.findById(req.personId).populate('tags');
  req.person = person;

  await person.populateBirthAndDeath();
  const birthYear = person.getBirthYear();
  const deathYear = person.getDeathYear();
  const immigrationYear = await person.getImmigrationYear();

  const sources = await Source.find({people: person}).populate('story');

  const incompleteSourceList = await createIncompleteSourceList(sources);

  res.renderPersonProfile('checklist', {
    checklistSections: [
      {
        title: 'Links',
        items: createLinkChecklist(person)
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
        items: createSourceChecklist({sources, person, birthYear, deathYear, immigrationYear})
      },
    ],
    incompleteSourceList,
  });
}

function createLinkChecklist(person) {
  const links = [
    {title: 'Ancestry'},
    {title: 'FamilySearch'},
    {title: 'FindAGrave', strikeLiving: true},
    {title: 'Lundberg', strikeLiving: true},
    {title: 'WikiTree'},
  ];
  links.forEach(link => {
    link.complete = !!person.getLink(link.title);
  });
  return links;
}

function createRelativesChecklist(person) {
  const numberOfChildren = {title: 'number of children'};

  const childrenTagValue = person.getTagValue('number of children');
  if (!childrenTagValue) {
    numberOfChildren.note = 'status not specified';
  } else if (childrenTagValue === 'unknown') {
    numberOfChildren.note = 'incomplete';
  } else if (childrenTagValue === 'too distant') {
    numberOfChildren.strike = true;
    numberOfChildren.note = 'incomplete, but relationship is too distant';
  } else if (childrenTagValue === 'done') {
    numberOfChildren.complete = true;
    if (person.children.length) {
      numberOfChildren.note = 'done: all children are in database';
    } else {
      numberOfChildren.note = 'done: never had any children';
    }
  } else {
    numberOfChildren.complete = true;
    numberOfChildren.note = 'done: exact number is manually specified';
  }

  return [
    {title: 'parent 1', complete: person.parents.length >= 1},
    {title: 'parent 2', complete: person.parents.length >= 2},
    numberOfChildren,
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

function createSourceChecklist({sources, person, birthYear, deathYear, immigrationYear}) {
  const sourceChecklist = [];

  const checkForStory = (options = {}) => {
    // options.attr = what story attribute to find (title or type)
    // options.title = what story attribute value to find
    // options.strikeLiving = show as non-applicable if the person is living
    // options.isNotFindable = show as non-applicable because probably not findable
    // options.notFindableNote = note to show if item is not found
    // options.note = note to show if item is found

    const {attr, title} = options;

    const foundSource = sources.some(source => source.story[attr] === title);

    const isNotFindable = !foundSource && options.isNotFindable;

    sourceChecklist.push({
      complete: foundSource,
      strikeLiving: options.strikeLiving,
      strike: isNotFindable,
      title,
      note: isNotFindable ? options.notFindableNote : options.note,
    });
  };

  checkForStory({attr: 'type', title: 'cemetery', strikeLiving: true});

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

    let isNotFindable, notFindableNote;

    if (immigrationYear && immigrationYear > year) {
      isNotFindable = true;
      notFindableNote = 'not found; probably before immigration';
    } if (year === 1890) {
      isNotFindable = true;
      notFindableNote = 'not found; probably destroyed';
    }

    checkForStory({
      attr: 'title',
      title: 'Census USA ' + year,
      isNotFindable,
      notFindableNote,
    });
  }

  if (birthYear != null && person.gender != 1) {
    if (birthYear < 1900 && (!deathYear || deathYear > 1917)) {
      checkForStory({attr: 'title', title: 'World War I draft'});
    }
    if (birthYear < 1926 && (!deathYear || deathYear > 1940)) {
      checkForStory({attr: 'title', title: 'World War II draft'});
    }
  }

  return sourceChecklist;
}

async function createIncompleteSourceList(sourceList) {
  const list = [];

  for (let i in sourceList) {
    await handleSource(sourceList[i]);
  }

  return list;

  async function handleSource(source) {
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

    if (isCensus) {
      await source.populateCiteText({includeStory: false});
      if (source.citeText.length === 0) {
        missing.push('citation text');
      }
      if (!source.links.some(link => link.match(' Ancestry'))) {
        missing.push('Ancestry link');
      }
      if (!source.links.some(link => link.match(' FamilySearch'))) {
        missing.push('FamilySearch link');
      }
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
  }
}
