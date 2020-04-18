
function getDateValues(req) {
  var date = {
    year: req.body.date_year,
    month: req.body.date_month,
    day: req.body.date_day,
    display: req.body.date_display,
  };

  return date;
}

module.exports = getDateValues;
