const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', showMap);

function showMap(req, res, next) {
  getEventsAndSources((error, sources, events) => {
    if (error) {
      return next(error);
    }

    const pins = {};

    sources.concat(events).forEach(pin => {
      const country = (pin.location || {}).country || 'Other';

      pins[country] = pins[country] || [];

      pins[country].push(pin);
    });

    res.render('layout', {
      view: 'map/index',
      title: 'Map',
      events: events,
      sources: sources,
      pins: pins,
    });
  });
}

function getEventsAndSources(callback) {
  mongoose.model('Source')
  .find({})
  .populate('people')
  .exec((error1, sources) => {
    mongoose.model('Event')
    .find({})
    .populate('people')
    .exec((error2, events) => {
      callback(error1 || error2, sources, events);
    });
  });
}

module.exports = router;
