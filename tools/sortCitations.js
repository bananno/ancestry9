
function sortCitations(citationList, sortBy, endPoint) {
  var madeChange = false;
  var endPoint = endPoint || citationList.length - 1;

  for (var i = 0; i < endPoint; i++) {
    var citation1 = citationList[i];
    var citation2 = citationList[i + 1];

    if (citationsShouldSwap(citation1, citation2, sortBy)) {
      madeChange = true;
      citationList[i] = citation2;
      citationList[i + 1] = citation1;
    }
  }

  if (madeChange) {
    return sortCitations(citationList, sortBy, endPoint - 1);
  }

  return citationList;
}

function citationsShouldSwap(citation1, citation2, sortBy) {
  if (sortBy == 'item') {
    return compareItems(citation1.item, citation2.item,
      citation1.information, citation2.information);
  }

  if (sortBy == 'person') {
    return citation1.person._id > citation2.person._id;
  }

  return false;
}

var citationItemOrder = [
  'name',
  'birth',
  'christening',
  'baptism',
  'marriage',
  'marriage - spouse',
  'marriage 1',
  'marriage 1 - spouse',
  'marriage 2',
  'marriage 2 - spouse',
  'divorce',
  'immigration',
  'naturalization',
  'death',
  'funeral',
  'obituary',
  'residence',
];

function compareItems(item1, item2, information1, information2) {

  for (var i = 0; i < citationItemOrder.length; i++) {
    if (item1 == item2) {
      return information1 > information2;
    }

    if (item1 == citationItemOrder[i]) {
      return false;
    }

    if (item2 == citationItemOrder[i]) {
      return true;
    }

    if (item1 == citationItemOrder[i] + ' - date') {
      return false;
    }

    if (item2 == citationItemOrder[i] + ' - date') {
      return true;
    }

    if (item1 == citationItemOrder[i] + ' - place') {
      return false;
    }

    if (item2 == citationItemOrder[i] + ' - place') {
      return true;
    }

    if (item1.match(citationItemOrder[i])) {
      return false;
    }

    if (item2.match(citationItemOrder[i])) {
      return true;
    }
  }

  return item1 > item2;
}

module.exports = sortCitations;
