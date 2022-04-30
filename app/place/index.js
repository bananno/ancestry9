const {
  Event,
  createController,
} = require('../import');

module.exports = createRoutes;

function createRoutes(router) {
  router.get('/place/:country/:region1/:region2/:city', renderShowPlace);
}

async function renderShowPlace(req, res) {
  const {country, region1, region2, city} = req.params;
  const locationObj = {country, region1, region2, city};
  const title = [country, region1, region2, city].join(' / ');

  const events = await Event.find({
    'location.country': country,
    'location.region2': region2,
    'location.region1': region1,
    'location.city': city,
  }).populate('people');

  Event.sortByDate(events);

  res.render('place/show', {
    events,
    locationObj,
    title: title + '/' + (events.length),
  });
}
