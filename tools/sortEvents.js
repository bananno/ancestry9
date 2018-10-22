
function sortEvents(eventList, endPoint) {
  var madeChange = false;
  var endPoint = endPoint || eventList.length - 1;

  for (var i = 0; i < endPoint; i++) {
    var event1 = eventList[i];
    var event2 = eventList[i + 1];

    if (eventsShouldSwap(event1.date, event2.date)) {
      madeChange = true;
      eventList[i] = event2;
      eventList[i + 1] = event1;
    }
  }

  if (madeChange) {
    return sortEvents(eventList, endPoint - 1);
  }

  return eventList;
}

function eventsShouldSwap(date1, date2) {
  if (date1 == null) {
    return false;
  }

  if (date2 == null) {
    return true;
  }

  if (date1.year == date2.year) {

    if (date1.month == date2.month) {
      return date1.day > date2.day;
    }

    return date1.month > date2.month;
  }

  return date1.year > date2.year;
}

module.exports = sortEvents;
