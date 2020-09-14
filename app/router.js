const express = require('express');
const router = express.Router();
module.exports = router;

const routerTools = require('./tools/routerTools');

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

router.get('/shared', (req, res) => { // BROKEN due to relative filepaths
  res.renderOriginal('../shared/index.html');
});

[
  'checklist',
  'citation',
  'event',
  'export',
  'image',
  'map',
  'notation',
  'person',
  'source',
  'story',
  'tag',
  'misc',
].forEach(item => require('./' + item)(router));
