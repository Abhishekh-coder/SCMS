const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../security/authenticate.middleware');

router.get('/me', authenticateToken, (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    data: {
      userUuid: user.userUuid,
      loginId: user.loginId,
      fullName: user.fullName,
      email: user.email,
      profileType: user.profileType,
      roles: user.roles,
      tenantId: user.tenantId,
      campusId: user.campusId
    }
  });
});

module.exports = router;
