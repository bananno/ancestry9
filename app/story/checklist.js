const {
  Person,
  Story,
} = require('../import');

module.exports = renderStoryChecklist;

async function renderStoryChecklist(req, res) {
  req.story = await Story.findById(req.params.id).populate('tags');

  if (['World War I draft', 'World War II draft'].includes(req.story.title)) {
    return storyChecklistWorldWarDraftCards(req, res);
  }
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
