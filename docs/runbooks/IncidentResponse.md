# 🚨 CCMS Production Incident Response Runbook (v1.0)

---

## 1. Database Connection Failure & Recovery

### Symptom
`MongooseError: Could not connect to any servers in your MongoDB Atlas cluster` or API returns `500 Internal Server Error` with `MONGO_CONNECTION_FAILED`.

### Immediate Mitigations
1. **Check Primary DB Container / Instance**:
   ```bash
   docker ps | grep mongo
   docker logs ccms-mongodb --tail 100
   ```
2. **Restart MongoDB Service**:
   ```bash
   docker-compose restart ccms-mongodb
   ```
3. **Verify App Reconnection**:
   - `backend/src/config/database.js` uses automatic non-blocking reconnection logic. Upon DB recovery, backend automatically re-establishes pool.

---

## 2. Token Replay Attack Security Alert Mitigation

### Symptom
Event `TokenReplayDetected` is published by `TokenService` indicating a compromised Refresh Token family.

### Immediate Mitigations
1. **Automated Protection**: `TokenService.rotateRefreshToken()` automatically revokes all refresh tokens matching `familyId` and terminates active session.
2. **Force User Logout & Password Reset**:
   ```javascript
   // Execute via Control Plane Admin API
   POST /api/v1/admin/users/:userUuid/force-password-reset
   ```

---

## 3. SLA Breach Emergency Escalation Override

### Symptom
Department complaints breaching SLA without assigned handler response.

### Immediate Mitigations
1. Trigger dynamic reassignment using Control Plane API:
   ```http
   POST /api/v1/admin/workflows/override-escalation
   {
     "departmentCode": "CSE",
     "targetRole": "DEAN"
   }
   ```
