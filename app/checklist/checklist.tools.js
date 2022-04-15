const {
  Person,
  Source,
  removeDuplicatesFromList,
  sortBy,
} = require('../import');

module.exports = {
  getObituaryChecklistData,
};

async function getObituaryChecklistData() {
  const obituaries = await Source.findObituaries(); // populates people

  // only interested in the first person in each source; it should be THEIR obituary
  const peopleWithObituary = removeDuplicatesFromList(
    obituaries.map(source => source.people[0]));

  const peopleWithObituaryIds = peopleWithObituary.map(person => person._id);
  const people = await Person.find({_id: {$nin: peopleWithObituaryIds}});
  await Person.populateBirthAndDeath(people, {populateBirth: false});

  const peopleLists = {
    peopleWithObituary,
    peopleWithoutObituary: people.filter(person => !person.living && person.getDeathYear()),
    living: people.filter(person => person.living && !person.getDeathYear()),
    missingDeathDate: people.filter(person => !person.living && !person.getDeathYear()),
  };

  sortBy(peopleLists.peopleWithoutObituary, person => -person.getDeathYear());

  return {obituaries, peopleLists};
}
