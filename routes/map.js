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
      const region1 = (pin.location || {}).region1 || 'Other';
      const region2 = (pin.location || {}).region2 || 'Other';
      const city = (pin.location || {}).city || 'Other';

      pins[country] = pins[country] || [];
      pins[country][region1] = pins[country][region1] || [];
      pins[country][region1][region2] = pins[country][region1][region2] || [];
      pins[country][region1][region2][city] = pins[country][region1][region2][city] || [];

      pins[country][region1][region2][city].push(pin);
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
