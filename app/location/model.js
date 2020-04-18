const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  country: String,
  region1: String, // province or state
  region2: String, // county
  city: String,
  latitude: Number,
  longitude: Number,
  zoom: {
    type: Number,
    default: 0,
  },
});

mongoose.model('Location', locationSchema);
