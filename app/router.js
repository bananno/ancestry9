const express = require('express');
const router = express.Router();
module.exports = router;

const routerTools = require('./tools/routerTools');
const resources = require('./resources');

router.use((req, res, next) => {
  res.renderOriginal = res.render;

  res.render = (view, options) => {
    if (view === 'layout') { // phase out
      return res.renderOriginal(view, options);
    }
    return res.renderOriginal('layout', {view, ...options});
  };

  req.getFormDataDate = () => routerTools.getFormDataDate(req);
  req.getFormDataLocation = () => routerTools.getFormDataLocation(req);
  req.getFormDataTags = () => routerTools.getFormDataTags(req);

  next();
});

// HOME

router.get('/', (req, res) => {
  res.render('index', {title: null});
});

resources.forEach(({name, hasRoutes}) => {
  if (hasRoutes) {
    require(`./${name}`)(router);
  };
});
