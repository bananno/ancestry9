const mongoose = require('mongoose');
const tools = require('../tools/modelTools');
const constants = require('./constants');

const methods = {};
module.exports = methods;

methods.getAllSharedData = getAllSharedData;
methods.sortByDate = tools.sorting.sortByDate;

async function getAllSharedData() {
  const Event = mongoose.model('Event');
  const rawList = await Event.find({}).populate('people');

  const eventList = rawList.map(event => {
    // A historical event with NO people in the list is a global event. Always include.
    if (event.people.length == 0 && event.tags.includes('historical')) {
      return event;
    }

    // Remove non-shared people from the event.
    // Then un-populate people, leaving _id only.
    event.people = event.people.map(person => {
      return person.sharing.level === 2 ? person._id : false;
    }).filter(Boolean);

    // Keep (share) the event IF it applies to at least one shared person.
    if (event.people.length > 0) {
      return event;
    }

    // Discard all other events.
    return false;
  }).filter(Boolean);

  const newList = tools.reduceListToExportData(eventList, constants.fieldNames);

  Event.sortByDate(newList);

  return newList;
}
