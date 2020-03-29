module.exports = removeDuplicatesFromList;

function removeDuplicatesFromList(list) {
  const done = {};

  return list.filter(item => {
    let itemKey = '' + (item._id || item);
    if (done[itemKey]) {
      return false;
    }
    done[itemKey] = true;
    return true;
  });
}
