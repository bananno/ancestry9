
function sortSources(sourceList, sortBy, endPoint) {
  var madeChange = false;
  var endPoint = endPoint || sourceList.length;

  for (var i = 0; i < endPoint - 1; i++) {
    var source1 = sourceList[i];
    var source2 = sourceList[i + 1];

    if (sourcesShouldSwap(source1, source2, sortBy)) {
      madeChange = true;
      sourceList[i] = source2;
      sourceList[i + 1] = source1;
    }
  }

  if (madeChange) {
    return sortSources(sourceList, sortBy, endPoint - 1);
  }

  return sourceList;
}

function sourcesShouldSwap(source1, source2, sortBy) {
  if (sortBy == 'group') {
    return compareGroup(source1.type, source1.group, source2.type, source2.group);
  }
}

function compareGroup(type1, group1, type2, group2) {
  var sort1 = ((type1 || '') + ' ' + (group1 || '')).toLowerCase();
  var sort2 = ((type2 || '') + ' ' + (type2 || '')).toLowerCase();

  return sort1 > sort2;
}

module.exports = sortSources;
