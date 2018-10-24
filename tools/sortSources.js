
function sortSources(sourceList, sortBy, endPoint) {
  var madeChange = false;
  var endPoint = endPoint || sourceList.length - 1;

  for (var i = 0; i < endPoint; i++) {
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
    return compareGroup(source1.group, source2.group);
  }
}

function compareGroup(group1, group2) {
  if (group1 == null || group1 == '') {
    return false;
  }

  if (group2 == null || group2 == '') {
    return true;
  }

  return group1.toLowerCase() > group2.toLowerCase();
}

module.exports = sortSources;
