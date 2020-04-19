const mongoose = require('mongoose');
const sorting = require('./sorting');
const dateStructure = require('./dateStructure');
const locationStructure = require('./locationStructure');

module.exports = {
  mongoose,
  dateStructure,
  locationStructure,
  sorting,
  ...sorting,
};
