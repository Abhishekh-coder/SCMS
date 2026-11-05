const { connectDatabaseConfig } = require('../config/database');

function connectDatabase() {
  return connectDatabaseConfig();
}

module.exports = { connectDatabase };
