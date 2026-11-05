const express = require('express');
const router = express.Router();
const workflowEngine = require('./engine/workflowEngine');

router.get('/config', (req, res) => {
  res.json({
    success: true,
    workflow: workflowEngine.config
  });
});

module.exports = router;
