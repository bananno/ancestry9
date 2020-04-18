
var compareDate = require('./compareDate');

function sortEvents(eventList, endPoint) {
  var madeChange = false;
  var endPoint = endPoint || eventList.length - 1;

  for (var i = 0; i < endPoint; i++) {
    var event1 = eventList[i];
    var event2 = eventList[i + 1];

    if (compareDate(event1.date, event2.date)) {
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

module.exports = sortEvents;
