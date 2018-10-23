
function getNewEventValues(req) {
  var newEvent = {
    title: req.body.title.trim(),
    date: {
      year: req.body.date_year,
      month: req.body.date_month,
      day: req.body.date_day,
    },
    location: {
      country: req.body.location_country,
    },
    people: [],
  };

  if (newEvent.title == '') {
    return null;
  }

  return newEvent;
}

module.exports = getNewEventValues;
