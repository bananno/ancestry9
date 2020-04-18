module.exports = citationSort;

const citationItemOrder = [
  'name',
  'birth',
  'christening',
  'baptism',
  'father',
  'mother',
  'spouse',
  'marriage',
  'marriage - spouse',
  'marriage 1',
  'marriage 1 - spouse',
  'spouse 1',
  'marriage 2',
  'marriage 2 - spouse',
  'spouse 2',
  'divorce',
  'immigration',
  'naturalization',
  'death',
  'funeral',
  'obituary',
  'residence',
];

const citationItemSubOrder = [
  '',
  'name',
  'date',
  'place',
];

function citationSort(citationList, sortBy, peopleList) {
  if (peopleList) {
    peopleList = peopleList.map(person => person._id + '');
  }

  const sortRef = {};

  citationList.forEach(citation => {
    let item1 = citation.item, item2 = '';

    if (citation.item.match(' - ')) {
      item1 = citation.item.slice(0, citation.item.indexOf(' - ')).trim();
      item2 = citation.item.slice(citation.item.indexOf(' - ') + 3).trim();
    }

    let itemIndex1 = citationItemOrder.indexOf(item1);
    let itemIndex2 = citationItemSubOrder.indexOf(item2);

    if (itemIndex1 == -1) {
      itemIndex1 = citationItemOrder.length;
    }

    if (itemIndex2 == -1) {
      itemIndex2 = citationItemSubOrder.length;
    }

    if (itemIndex1 < 10) {
      itemIndex1 = '0' + itemIndex1;
    }

    if (itemIndex2 < 10) {
      itemIndex2 = '0' + itemIndex2;
    }

    const itemSortString = [itemIndex1, itemIndex2, item1, item2].join('-');

    let personSortString = '';

    if (peopleList) {
      let personIndex = peopleList.indexOf(citation.person._id + '');
      if (personIndex == -1) {
        personIndex = peopleList.length;
      }
      if (personIndex < 10) {
        personIndex = '0' + personIndex;
      }

      personSortString = personIndex + '-' + citation.person.name;
    }

    let sortString = '';

    if (sortBy == 'item') {
      sortString += itemSortString + '-' + personSortString;
    } else {
      sortString += personSortString + '-' + itemSortString;
    }

    sortString += '-' + citation.information;

    if (citation.source.story && citation.source.story.title) {
      sortString += '-' + citation.source.story.title;
    } else {
      sortString += '-' + citation.source.story;
    }

    sortString += '-' + citation.source.title;

    sortRef[citation._id] = sortString;
  });

  citationList.sort((a, b) => {
    let strA = sortRef[a._id];
    let strB = sortRef[b._id];
    return strA === strB ? 0 : strA < strB ? -1 : 1;
  });
}


