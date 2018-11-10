
var getLocationValues = require('./getLocationValues');
var getDateValues = require('./getDateValues');

function getNewEventValues(req) {
  var newEvent = {
    title: req.body.title.trim(),
    people: [],
  };

  if (newEvent.title == '') {
    return null;
  }

  newEvent.location = getLocationValues(req);
  newEvent.date = getDateValues(req);

  return newEvent;
}

module.exports = getNewEventValues;
