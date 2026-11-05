const express = require('express');
const aiController = require('./controllers/ai.controller');
const { authenticateToken } = require('../../security/authenticate.middleware');
const { authorize } = require('../../security/authorize.middleware');

const router = express.Router();

// All AI routes require JWT authentication
router.use(authenticateToken);

// POST /api/v1/ai/triage -> Smart complaint triage & categorization
router.post('/triage', (req, res, next) => aiController.triage(req, res, next));

// GET /api/v1/ai/recommendations -> List pending AI recommendations for human review
router.get('/recommendations', (req, res, next) => aiController.getPendingRecommendations(req, res, next));

// POST /api/v1/ai/recommendations/:recommendationUuid/action -> Human approval / rejection
router.post('/recommendations/:recommendationUuid/action', (req, res, next) => aiController.actionRecommendation(req, res, next));

module.exports = router;
