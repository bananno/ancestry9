var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

require('./model/db');
require('./model/people');
require('./model/events');
require('./model/sources');
require('./model/citations');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var indexRouter = require('./routes/index');
var personRouter = require('./routes/person');
var eventRouter = require('./routes/event');
var sourceRouter = require('./routes/source');
var mapRouter = require('./routes/map');

app.use('/', indexRouter);
app.use('/person/', personRouter);
app.use('/event/', eventRouter);
app.use('/source/', sourceRouter);
app.use('/map/', mapRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('layout', {
    view: 'error',
    title: 'Error',
  });
});

module.exports = app;
