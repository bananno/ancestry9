
function sortPeople(peopleList, sortBy, endPoint) {
  var madeChange = false;
  var endPoint = endPoint || peopleList.length;

  for (var i = 0; i < endPoint - 1; i++) {
    var person1 = peopleList[i];
    var person2 = peopleList[i + 1];

    if (peopleShouldSwap(person1, person2, sortBy)) {
      madeChange = true;
      peopleList[i] = person2;
      peopleList[i + 1] = person1;
    }
  }

  if (madeChange) {
    return sortPeople(peopleList, sortBy, endPoint - 1);
  }

  return peopleList;
}

function peopleShouldSwap(person1, person2, sortBy) {
  if (sortBy == 'name') {
    var name1 = person1.name.toLowerCase();
    var name2 = person2.name.toLowerCase();
    return name1 > name2;
  }

  return false;
}

function compareGroup(type1, group1, type2, group2) {
  var sort1 = ((type1 || '') + ' ' + (group1 || '')).toLowerCase();
  var sort2 = ((type2 || '') + ' ' + (group2 || '')).toLowerCase();

  return sort1 > sort2;
}

module.exports = sortPeople;
