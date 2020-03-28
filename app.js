const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const modelFiles = require('./models/index');

const routeFiles = [
  ['index'],
  ['map'],
  ['database'],
  ['image'],
];

modelFiles.forEach(model => {
  require('./models/' + model);
});

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

routeFiles.forEach(filename => {
  const router = require('./routes/' + filename);
  app.use('/', router);
});

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
