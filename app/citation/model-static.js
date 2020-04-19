const mongoose = require('mongoose');
const citationSort = require('./sort');
const methods = {};
module.exports = methods;

methods.getAllSharedData = async () => {
  const allCitations = await mongoose.model('Citation').find({})
    .populate('person').populate('source');

  // Discard any citation if its person or source is not shared.
  // Then un-populate person and source, leaving IDs only.
  return allCitations.filter(citation => {
    return citation.person.isPublic() && citation.source.sharing;
  }).map(citation => citation.toSharedObject());
};

methods.populateStories = async citations => {
  for (let i in citations) {
    await citations[i].populateStory();
  }
};

methods.sortByItem = (citations, people) => {
  return citationSort(citations, 'item', people);
};

methods.sortByPerson = (citations, people) => {
  return citationSort(citations, 'person', people);
};
