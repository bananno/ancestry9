const {
  Person,
  Story,
} = require('../import');

module.exports = renderStoryChecklist;

async function renderStoryChecklist(req, res) {
  req.story = await Story.findById(req.params.id).populate('tags');

  if (req.story.title.match('Census USA')) {
    return storyChecklistUnitedStatesCensus(req, res);
  }

  if (['World War I draft', 'World War II draft'].includes(req.story.title)) {
    return storyChecklistWorldWarDraftCards(req, res);
  }
}

async function storyChecklistUnitedStatesCensus(req, res) {
  const story = req.story;
  const censusYear = story.date.year;

  await story.populateEntries();

  const checkItems = [
    'sharing', 'content', 'summary', 'image',
    'Ancestry', 'FamilySearch', 'citation',
  ];

  for (let i in story.entries) {
    await story.entries[i].populateCiteText({includeStory: false});
  }

  const sourceList = story.entries.map(source => {
    return {
      source,
      sharing: source.sharing,
      content: !!source.content,
      summary: !!source.summary,
      image: source.images.length > 0,
      Ancestry: source.links.some(link => link.match(' Ancestry')),
      FamilySearch: source.links.some(link => link.match(' FamilySearch')),
      citation: source.citeText.length > 0,
    };
  });

  const peopleWithEntry = {};

  story.entries.forEach(source => {
    source.people.forEach(person => {
      const personId = '' + person;
      peopleWithEntry[personId] = true;
    });
  });

  const people = await Person.find({});

  await Person.populateBirthAndDeath(people);

  const peopleLists = {
    done: [],
    missingDates: [],
    diedBefore: [],
    bornAfter: [],
    maybeNotInCountry: [],
    missingStory: [],
  };

  for (let i in people) {
    const person = people[i];

    const status = (() => {
      if (peopleWithEntry['' + person._id]) {
        return 'done';
      }

      const birthYear = person.getBirthYear();
      const deathYear = person.getDeathYear();

      if (!birthYear && !deathYear) {
        return 'missingDates';
      }

      if (deathYear && deathYear < censusYear) {
        return 'diedBefore';
      }

      if (birthYear && birthYear > censusYear) {
        return 'bornAfter';
      }

      const birthCountry = person.getBirthCountry();
      const deathCountry = person.getDeathCountry();

      if ((birthCountry && birthCountry != 'United States')
          || (deathCountry && person.getDeathCountry() != 'United States')) {
        return 'maybeNotInCountry'
      }

      return 'missingStory';
    })();

    peopleLists[status].push(person);
  }

  res.renderStory('checklistCensus', {checkItems, sourceList, censusYear, peopleLists});
}

async function storyChecklistWorldWarDraftCards(req, res) {
  await req.story.populateEntries();

  const peopleWithEntry = {};

  req.story.entries.forEach(source => {
    const personId = '' + source.people[0];
    peopleWithEntry[personId] = true;
  });

  const people = await Person.find({gender: 2});

  await Person.populateBirthAndDeath(people);

  const peopleLists = {
    done: [],
    missingDates: [],
    diedBefore: [],
    bornAfter: [],
    tooYoung: [],
    tooOld: [],
    missingCard: [],
  };

  const isWWI = req.story.title === 'World War I draft';

  const draftStart = isWWI ? 1915 : 1940;
  const draftEnd = isWWI ? 1920 : 1945;

  for (let i in people) {
    const person = people[i];

    const draftCategory = (() => {
      if (peopleWithEntry['' + person._id]) {
        return 'done';
      }

      const birthYear = person.getBirthYear();
      const deathYear = person.getDeathYear();

      if (!birthYear && !deathYear) {
        return 'missingDates';
      }

      if (deathYear && deathYear < draftStart) {
        return 'diedBefore';
      }

      if (birthYear > draftEnd) {
        return 'bornAfter';
      }

      if (birthYear > (draftEnd - 17)) {
        return 'tooYoung';
      }

      if (birthYear < (draftStart - 50)) {
        return 'tooOld';
      }

      return 'missingCard';
    })();

    peopleLists[draftCategory].push(person);
  }

  res.renderStory('checklistDraftCard', {
    draftStart,
    draftEnd,
    peopleLists,
  });
}
