
function getLocationValues(req) {
  var location = {
    country: req.body.location_country,
  };

  return location;
}

module.exports = getLocationValues;
