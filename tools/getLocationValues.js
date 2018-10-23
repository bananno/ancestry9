
function getLocationValues(req) {
  var location = {
    country: req.body.location_country,
    region1: req.body.location_region1,
    region2: req.body.location_region2,
    city: req.body.location_city,
    notes: req.body.location_notes,
  };

  if (location.country == 'United States') {
    location.region1 = req.body.location_region1_usa;
  }

  return location;
}

module.exports = getLocationValues;
