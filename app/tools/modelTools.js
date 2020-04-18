const mongoose = require('mongoose');
const citationSort = require('./citationSort');
const personPopulateConnections = require('./personPopulateConnections');
const sorting = require('../tools/sorting');
const dateStructure = require('./dateStructure');
const locationStructure = require('./locationStructure');

module.exports = {
  mongoose,
  citationSort,
  personPopulateConnections,
  dateStructure,
  locationStructure,
  ...sorting,
};
