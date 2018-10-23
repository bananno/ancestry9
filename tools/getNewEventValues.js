
var getLocationValues = require('./getLocationValues');

function getNewEventValues(req) {
  var newEvent = {
    title: req.body.title.trim(),
    date: {
      year: req.body.date_year,
      month: req.body.date_month,
      day: req.body.date_day,
    },
    people: [],
  };

  if (newEvent.title == '') {
    return null;
  }

  newEvent.location = getLocationValues(req);

  return newEvent;
}

module.exports = getNewEventValues;
