module.exports = {
  getFormDataDate,
  getFormDataLocation,
  getFormDataTags,
};

function getFormDataDate(req) {
  return {
    year: req.body.date_year,
    month: req.body.date_month,
    day: req.body.date_day,
    display: req.body.date_display,
  };
}

function getFormDataLocation(req) {
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

function getFormDataTags(req) {
  return (req.body.tags || '').split('\n').map(s => s.trim()).filter(Boolean);
}
