const authService = require('./auth.service');
const sessionService = require('./session.service');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register({ ...req.body, req });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      // Accept loginId (new standard) or email (legacy fallback)
      const { loginId, email, password } = req.body;
      const result = await authService.login({ loginId, email, password, req });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshTokenRotation({ refreshToken });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { email, otpCode } = req.body;
      const result = await authService.verifyEmail({ email, otpCode });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword({ email });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, otpCode, newPassword } = req.body;
      const result = await authService.resetPassword({ email, otpCode, newPassword });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = authService.getUserProfile(req.user.userUuid);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getSessions(req, res, next) {
    try {
      const sessions = sessionService.getUserSessions(req.user.userUuid);
      res.json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  }

  async revokeSession(req, res, next) {
    try {
      const sessionUuid = req.params.id;
      const success = sessionService.revokeSession(req.user.userUuid, sessionUuid);
      res.json({ success, message: success ? 'Session revoked.' : 'Session not found.' });
    } catch (err) {
      next(err);
    }
  }

  async logoutAll(req, res, next) {
    try {
      sessionService.revokeAllSessions(req.user.userUuid);
      res.json({ success: true, message: 'All active sessions terminated.' });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      if (req.user && req.user.sessionUuid) {
        sessionService.revokeSession(req.user.userUuid, req.user.sessionUuid);
      }
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
