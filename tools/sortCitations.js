
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
    return compareItems(citation1.item, citation2.item);
  }

  return false;
}

var citationItemOrder = [
  'name',
  'birth',
  'christening',
  'baptism',
  'marriage',
  'immigration',
  'naturalization',
  'death',
  'funeral',
  'obituary',
  'residence',
];

function compareItems(item1, item2) {

  for (var i = 0; i < citationItemOrder.length; i++) {
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
  }

  return false;
}

module.exports = sortCitations;
