const {
  Person,
  sorting,
} = require('../import');

module.exports = {getTimelineInfo, getYearInfo};

async function getTimelineInfo() {
  const allPeople = await Person.find({});

  const anna = allPeople.find(person => person.isRoot());

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

  return {
    startYear,
    endYear,
    yearsWithEvents,
    peopleBornPerYear,
    maxPeoplePerYear,
  };
}

async function getYearInfo(year) {
  const people = await Person.find();

  await Person.populateBirthAndDeath(people);

  const peopleLists = {
    bornThisYear: [],
    diedThisYear: [],
    livedThisYear: [],
  };

  people.forEach(person => {
    // note that one person might belong to two categories
    addPersonToYearCategories(peopleLists, person, year);
  });

  sorting.sortBy(peopleLists.diedThisYear, 'age');
  sorting.sortBy(peopleLists.livedThisYear, 'age');
  peopleLists.livedThisYear.reverse();

  // split livedThisYear into two columns
  const split = Math.round(peopleLists.livedThisYear.length / 2);
  peopleLists.livedThisYear1 = peopleLists.livedThisYear.slice(0, split);
  peopleLists.livedThisYear2 = peopleLists.livedThisYear.slice(split);
  delete peopleLists.livedThisYear;

  return {year, peopleLists};
}

// HELPERS

function addPersonToYearCategories(peopleLists, person, year) {
  const birthYear = person.getBirthYear();
  const deathYear = person.getDeathYear();

  if (birthYear && deathYear) {
    person.listNote = '(' + (year - birthYear) + ')';
  }

  // born this year - applicable even if the death date is missing
  if (birthYear === year) {
    peopleLists.bornThisYear.push(person);
    // in case born & died within the same year
    if (deathYear === year) {
      peopleLists.diedThisYear.push(person);
    }
  // died this year - applicable even if the birth date is missing
  } else if (deathYear === year) {
    peopleLists.diedThisYear.push(person);
  // lived during this year - only applicable if both dates are present
  } else if (birthYear && deathYear && birthYear < year && deathYear > year) {
    peopleLists.livedThisYear.push(person);
  }
}
