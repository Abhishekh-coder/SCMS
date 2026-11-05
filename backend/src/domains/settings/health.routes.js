const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'UP' : 'DISCONNECTED',
      scheduler: 'UP',
      eventBus: 'UP'
    }
  });
});

module.exports = router;
