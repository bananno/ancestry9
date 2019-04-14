function getLocationValues(req) {
  const location = {
    country: req.body['location-country'],
    region1: req.body['location-region1'],
    region2: req.body['location-region2'],
    city: req.body['location-city'],
    notes: req.body['location-notes'],
  };

  if (location.country == 'United States') {
    location.region1 = req.body['location-region1-usa'];
  } else if (location.country == 'other') {
    location.country = req.body['location-country-other'];
  }

  return location;
}

module.exports = getLocationValues;
