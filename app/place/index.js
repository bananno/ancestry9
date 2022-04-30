const {
  Event,
  createController,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/place/:country/:region1/:region2/:city', renderShowPlace);
  router.get('/place/:country/:region1/:city', renderShowPlace);
}

async function renderShowPlace(req, res) {
  const {country, region1, region2, city} = req.params;
  const locationObj = {country, region1, region2, city};
  const title = [country, region1, region2, city]
    .map(piece => piece === '-' ? '...' : piece)
    .join(' / ');

  const eventFilter = {};

  ['country', 'region1', 'region2', 'city'].forEach(locationPiece => {
    if (locationObj[locationPiece] && locationObj[locationPiece] !== '-') {
      eventFilter[`location.${locationPiece}`] = locationObj[locationPiece];
    }
  });

  const events = await Event.find(eventFilter).populate('people');

  Event.sortByDate(events);

  res.render('place/show', {
    events,
    locationObj,
    title,
  });
}
