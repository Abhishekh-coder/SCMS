const aiTriageService = require('../services/AiTriageService');
const mongoose = require('mongoose');
const { AiRecommendationSchema } = require('../../../../../database/schema/aiSchemas');
const { AppError, ValidationError } = require('../../../shared/errors/AppError');
const crypto = require('crypto');

const AiRecommendation = mongoose.models.AiRecommendation || mongoose.model('AiRecommendation', AiRecommendationSchema);

class AiController {
  async triage(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { title, description, complaintUuid } = req.body || {};

      if (!title || typeof title !== 'string' || title.trim().length < 5) {
        throw new ValidationError('Title must be at least 5 characters long.', 'VAL_001');
      }

      if (!description || typeof description !== 'string' || description.trim().length < 10) {
        throw new ValidationError('Description must be at least 10 characters long.', 'VAL_001');
      }

      const recommendation = await aiTriageService.triageComplaint({ title, description, complaintUuid });

      return res.status(200).json({
        success: true,
        message: 'AI smart triage analysis complete.',
        data: recommendation,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingRecommendations(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const recommendations = await AiRecommendation.find({ humanApprovalStatus: 'PENDING' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await AiRecommendation.countDocuments({ humanApprovalStatus: 'PENDING' });

      return res.status(200).json({
        success: true,
        message: 'Pending AI recommendations retrieved for human review.',
        data: recommendations,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async actionRecommendation(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { recommendationUuid } = req.params;
      const { decision } = req.body || {};

      if (!decision) {
        throw new ValidationError("Decision ('APPROVED' or 'REJECTED') is required.", 'VAL_001');
      }

      const updated = await aiTriageService.actionRecommendation(recommendationUuid, req.user, decision);

      return res.status(200).json({
        success: true,
        message: `AI recommendation '${updated.humanApprovalStatus}'.`,
        data: updated,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AiController();
