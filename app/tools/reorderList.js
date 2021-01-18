
function reorderList(valuelist, orderId, dataType) {
  if (['person', 'image'].includes(dataType)) {
    for (let i = 1; i < valuelist.length; i++) {
      const nextItem = valuelist[i];
      if (isSameItem(nextItem, orderId)) {
        valuelist[i] = valuelist[i - 1];
        valuelist[i - 1] = nextItem;
        break;
      }
    }
  } else if (['link', 'image', 'tag'].includes(dataType)) {
    if (orderId > 0 && valuelist.length > orderId) {
      const temp = valuelist[orderId - 1];
      valuelist[orderId - 1] = valuelist[orderId];
      valuelist[orderId] = temp;
    }
  }

  return valuelist;
}

function isSameItem(item1, item2) {
  let id1 = item1._id ? item1._id : item1;
  let id2 = item2._id ? item2._id : item2;
  id1 = '' + id1;
  id2 = '' + id2;
  return id1 == id2;
}

module.exports = reorderList;
