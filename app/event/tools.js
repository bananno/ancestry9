const {
  Citation,
  Event,
  getEditTableRows,
} = require('../import');

module.exports = {
  getEditEventInfo,
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

async function getEditEventInfo(eventId) {
  const event = await Event.findById(eventId).populate('people').populate('tags');

  if (!event) {
    return {};
  }

  const rootPath = `/event/${eventId}`;
  const tableRows = await getEditTableRows({item: event, rootPath});

  return {
    event,
    rootPath,
    data: {
      title: 'Edit Event',
      itemName: 'event',
      canDelete: true,
      tableRows,
    },
  };
}

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
