const express = require('express');
const rateLimit = require('express-rate-limit');
const registrationController = require('./controllers/registration.controller');
const authenticationController = require('./controllers/authentication.controller');
const { authenticateToken } = require('../../security/authenticate.middleware');

const router = express.Router();

// Rate Limiters (Relaxed in development for local testing)
const isDev = process.env.NODE_ENV !== 'production';

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 5,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_009',
      message: 'Too many registration requests from this IP. Please try again after 15 minutes.'
    }
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_009',
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
    }
  }
});

// Sprint 2A Endpoints
router.post('/register', registrationLimiter, (req, res, next) => registrationController.register(req, res, next));
router.post('/verify-email', (req, res, next) => registrationController.verifyEmail(req, res, next));
router.post('/resend-otp', (req, res, next) => registrationController.resendOtp(req, res, next));
router.post('/change-email', (req, res, next) => registrationController.changeEmail(req, res, next));
router.post('/debug-email', (req, res, next) => registrationController.debugEmail(req, res, next));
router.post('/reset-registration', (req, res, next) => registrationController.resetRegistration(req, res, next));

// Sprint 2B Authentication Endpoints
router.post('/login', loginLimiter, (req, res, next) => authenticationController.login(req, res, next));
router.post('/refresh', (req, res, next) => authenticationController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authenticationController.logout(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authenticationController.getMe(req, res, next));
router.get('/bootstrap', authenticateToken, (req, res, next) => authenticationController.getWorkspaceBootstrap(req, res, next));

module.exports = router;
