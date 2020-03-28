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

const checklistRouter = require('./checklist');
checklistRouter(router);

const eventRouter = require('./event');
eventRouter(router);

const notationRouter = require('./notation');
notationRouter(router);

const tagRouter = require('./tag');
tagRouter(router);
