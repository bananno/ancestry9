const express = require('express');
const router = express.Router();
module.exports = router;

router.use((req, res, next) => {
  res.renderOriginal = res.render;

  res.render = (view, options) => {
    if (view === 'layout') { // phase out
      return res.renderOriginal(view, options);
    }
    return res.renderOriginal('layout', {view, ...options});
  };

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
  'database',
  'event',
  'image',
  'map',
  'notation',
  'person',
  'source',
  'story',
  'tag',
].forEach(item => require('./' + item)(router));
