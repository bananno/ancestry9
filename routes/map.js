var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/', showMap);

function showMap(req, res, next) {
  res.redirect('/');
}

module.exports = router;
