
function reorderList(valuelist, orderId, attr) {
  if (attr == 'people') {
    for (var i = 1; i < valuelist.length; i++) {
      var thisPerson = valuelist[i];
      if (isSamePerson(thisPerson, orderId)) {
        valuelist[i] = valuelist[i - 1];
        valuelist[i - 1] = thisPerson;
        break;
      }
    }
  } else if (attr == 'links' || attr == 'images') {
    if (orderId > 0 && valuelist.length > orderId) {
      var temp = valuelist[orderId - 1];
      valuelist[orderId - 1] = valuelist[orderId];
      valuelist[orderId] = temp;
    }
  }

  return valuelist;
}

function isSamePerson(person1, person2) {
  var id1 = person1._id ? person1._id : person1;
  var id2 = person2._id ? person2._id : person2;
  id1 = '' + id1;
  id2 = '' + id2;
  return id1 == id2;
}

module.exports = reorderList;
