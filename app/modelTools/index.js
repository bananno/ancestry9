const citationSort = require('./citationSort');
const personPopulateConnections = require('./personPopulateConnections');
const sorting = require('./sorting');

module.exports = {
  citationSort,
  personPopulateConnections,
  ...sorting,
};
