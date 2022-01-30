const {
  Citation,
} = require('../import');

module.exports = {
  getShowEventInfo,
};

const eventTypesWithCitations = [
  'birth',
  'christening',
  'confirmation',
  'immigration',
  'naturalization',
  'marriage',
  'death',
];

async function getShowEventInfo(event) {
  const data = {
    showMoreInfo: false,
  };

  if (eventTypesWithCitations.includes(event.title)) {
    data.showMoreInfo = true;

    data.citations = await Citation
      .find({
        person: {$in: event.people},
        item: {$regex: `^${event.title}*`}
      })
      .populate('person')
      .populate('source');

    Citation.sortByPerson(data.citations, event.people);
    await Citation.populateStories(data.citations);
  }

  return data;
}
