module.exports = citationSort;

function citationSort(citationList, sortByType, peopleList) {
  if (peopleList) {
    peopleList = peopleList.map(person => person._id + '');
  }

  const sortRef = {};

  citationList.forEach(citation => {
    citation.getItemParts();
    citation.getSortKey();

    let personSortString = '';

    if (peopleList) {
      let personIndex = peopleList.indexOf(citation.person._id + '');
      if (personIndex == -1) {
        personIndex = peopleList.length;
      }

      personSortString = String(personIndex).padStart(2, '0') + '-' + citation.person.name;
    }

    const sortParts = [];

    if (sortByType == 'item') {
      sortParts.push(citation.sortKey);
      sortParts.push(personSortString);
    } else {
      sortParts.push(personSortString);
      sortParts.push(citation.sortKey);
    }

    if (citation.source.story && citation.source.story.title) {
      sortParts.push(citation.source.story.title);
    } else {
      sortParts.push(citation.source.story);
    }

    sortParts.push(citation.source.title);

    sortRef[citation._id] = sortParts.join('-');
  });

  citationList.sort((a, b) => {
    const strA = sortRef[a._id];
    const strB = sortRef[b._id];
    return strA === strB ? 0 : strA < strB ? -1 : 1;
  });
}
