const personPopulateConnections = require('./personPopulateConnections');
const sorting = require('./sorting');

module.exports = {
  personPopulateConnections,
  ...sorting,
};
