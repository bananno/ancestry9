module.exports = createRoutes;

const {getTimelineInfo, getYearInfo} = require('./timelineYearTools');

function createRoutes(router) {
  router.get('/timeline', showTimeline);
  router.get('/year/:year', showYear);
}

async function showTimeline(req, res) {
  const data = await getTimelineInfo();
  res.render('misc/timeline', data);
}

async function showYear(req, res) {
  const year = parseInt(req.params.year);
  const data = await getYearInfo(year);
  res.render('misc/year', data);
}
