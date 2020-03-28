const express = require('express');
const router = express.Router();
module.exports = router;

// HOME

router.get('/', (req, res, next) => {
  res.render('layout', {
    view: 'index',
    title: null,
  });
});

router.get('/shared', (req, res, next) => {
  res.render('../shared/index.html');
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
