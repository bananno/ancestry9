const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

require('./model/db');
require('./model/people');
require('./model/events');
require('./model/sources');
require('./model/citations');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const indexRouter = require('./routes/index');
const personRouter = require('./routes/person');
const eventRouter = require('./routes/event');
const sourceRouter = require('./routes/source');
const mapRouter = require('./routes/map');

app.use('/', indexRouter);
app.use('/person/', personRouter);
app.use('/event/', eventRouter);
app.use('/source/', sourceRouter);
app.use('/map/', mapRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('layout', {
    view: 'error',
    title: 'Error',
  });
});

module.exports = app;
