const {
  Person,
  sorting,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/timeline', showTimeline);
}

async function showTimeline(req, res) {
  const allPeople = await Person.find({});

  const anna = await Person.findOne({name: 'Anna Peterson'});

  const listOfAncestors = [];

  Person.populateAncestors(anna, allPeople, {intoList: listOfAncestors});

  await Person.populateBirthAndDeath(listOfAncestors);

  const yearsWithEvents = {};

  const peopleBornPerYear = {};

  let startYear = 1700, endYear = 0;

  const peopleAliveDuringYear = {};

  listOfAncestors.filter(person => {
    const birthYear = person.getBirthYear();
    const deathYear = person.getDeathYear();

    if (!birthYear || !deathYear) {
      return;
    }

    person.age = deathYear - birthYear;

    yearsWithEvents[birthYear] = true;
    yearsWithEvents[deathYear] = true;
    peopleBornPerYear[birthYear] = peopleBornPerYear[birthYear] || [];

    peopleBornPerYear[birthYear].push(person);

    if (startYear > birthYear) {
      startYear = birthYear;
    }
    if (endYear < deathYear) {
      endYear = deathYear;
    }

    for (let year = birthYear; year <= deathYear; year++) {
      peopleAliveDuringYear[year] = (peopleAliveDuringYear[year] || 0) + 1;
    }
  });

  let maxPeoplePerYear = 0;
  for (let year in peopleAliveDuringYear) {
    if (maxPeoplePerYear < peopleAliveDuringYear[year]) {
      maxPeoplePerYear = peopleAliveDuringYear[year];
    }
  }

  res.render('misc/timeline', {
    startYear,
    endYear,
    yearsWithEvents,
    peopleBornPerYear,
    maxPeoplePerYear,
  });
}
