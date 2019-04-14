const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const getLocationValues = require('../tools/getLocationValues');
module.exports = router;

router.get('/map', showMap);
router.post('/map/newPlace', addMapPlace);
router.post('/map/:id/delete', deleteMapPlace);

function showMap(req, res, next) {
  getEventsAndSources((error, sources, events, places) => {
    if (error) {
      return next(error);
    }

    const pins = {};

    const pinList = [];

    sources.forEach(source => {
      source.pinType = 'source';
      pinList.push(source);
    });

    events.forEach(event => {
      event.pinType = 'event';
      pinList.push(event);
    });

    pinList.forEach(pin => {
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
      places: places,
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
      mongoose.model('Location')
      .find({})
      .exec((error3, places) => {
        callback(error1 || error2 || error3, sources, events, places);
      });
    });
  });
}

function addMapPlace(req, res, next) {
  const newPlace = getLocationValues(req);

  ['latitude', 'longitude', 'zoom'].forEach(attr => {
    let value = req.body['location-' + attr].trim();
    if (value == '') {
      newPlace[attr] = 0;
    } else {
      value = parseFloat(value);
      newPlace[attr] = (isNaN(value) || value == 0) ? 0 : value;
    }
  });

  mongoose.model('Location').create(newPlace, err => {
    if (err) {
      return res.send('There was a problem adding the information to the database.');
    }
    res.redirect('/map');
  });
}

function deleteMapPlace(req, res, next) {
   mongoose.model('Location').deleteOne({ _id: req.params.id }, err => {
    if (err) {
      console.log(err);
      return res.send('There was a problem deleting the information from the database.');
    }
   res.redirect('/map');
  });
}
