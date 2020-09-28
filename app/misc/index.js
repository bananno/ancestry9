const {
  Person,
  sorting,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/timeline', showTimeline);
  router.get('/year/:year', showYear);
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

async function showYear(req, res) {
  const year = parseInt(req.params.year);

  const people = await Person.find();

  await Person.populateBirthAndDeath(people);

  const bornThisYear = [];
  const diedThisYear = [];
  const livedThisYear = [];

  people.forEach(person => {
    const birthYear = person.getBirthYear();
    const deathYear = person.getDeathYear();

    person.age = (birthYear && deathYear) ? (year - birthYear) : null;

    // born this year - applicable even if the death date is missing
    if (birthYear === year) {
      bornThisYear.push(person);
      // in case born & died within the same year
      if (deathYear === year) {
        diedThisYear.push(person);
      }
    // died this year - applicable even if the birth date is missing
    } else if (deathYear === year) {
      diedThisYear.push(person);
    // lived during this year - only applicable if both dates are present
    } else if (birthYear && deathYear && birthYear < year && deathYear > year) {
      livedThisYear.push(person);
    }
  });

  sorting.sortBy(diedThisYear, person => person.age);
  sorting.sortBy(livedThisYear, person => person.age);

  const livedThisYearR = livedThisYear.reverse();
  const split = Math.round(livedThisYear.length / 2);

  res.render('misc/year', {
    year,
    bornThisYear,
    diedThisYear,
    livedThisYear1: livedThisYearR.slice(0, split),
    livedThisYear2: livedThisYearR.slice(split),
  });
}
