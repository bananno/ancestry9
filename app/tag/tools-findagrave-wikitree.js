const {Person} = require('../import');

module.exports = getTagDataFindagraveWikitree;

const sectionKeysAndTitles = [
  ['manage-good', 'Profile managed - good condition'],
  ['need-work', 'Profile managed - needs work'],
  ['have', 'Have link but not managed'],
  ['missing', 'Need to add or find'],
  ['ignore', 'Ignore'],
];

async function getTagDataFindagraveWikitree({tag, isFindAGrave, isWikitree}) {
  const sections = [];
  const sectionMap = {};

  sectionKeysAndTitles.forEach(([sectionKey, title]) => {
    const section = {title, people: []};
    sectionMap[sectionKey] = section;
    sections.push(section);
  });

  const people = await Person.find();
  const linkTextMatch = isFindAGrave ? / FindAGrave$/ : / WikiTree$/;
  people.forEach(addPersonToStatusSection);

  return {sections, specialView: 'findagrave-wikitree'};

  function addPersonToStatusSection(person) {
    const link = person.links.find(link => link.match(linkTextMatch));
    const personLinkTagValue = getTagValue(person);
    let statusKey;

    if (!link) {
      if (personLinkTagValue === 'ignore' || (isFindAGrave && person.living)) {
        statusKey = 'ignore';
      } else {
        statusKey = 'missing';
      }
    } else if (personLinkTagValue === 'good') {
      statusKey = 'manage-good';
    } else if (personLinkTagValue === 'managed') {
      statusKey = 'need-work';
    } else {
      statusKey = 'have';
    }

    sectionMap[statusKey].people.push({person, link});
  }

  function getTagValue(item) {
    const index = item.tags.indexOf(tag._id);
    return item.tagValues[index];
  }
}
