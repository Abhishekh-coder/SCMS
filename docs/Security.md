# CCMS Security & Authorization Policy

## 🔐 Authentication Framework
- **Access Tokens**: Short-lived JWTs (15 min expiration) issued upon `/api/v1/auth/login`.
- **Refresh Tokens**: Long-lived secure tokens (7 days) stored in HTTP-only cookies and validated against `refreshTokens` collection.

## 🛡 Authorization Framework (RBAC / ABAC)
1. **RBAC Matrix**: Enforces static role permissions (`admin`, `hod`, `faculty`, `student`).
2. **ABAC Policies**: Enforces dynamic contextual conditions (e.g. `User.departmentId === Complaint.departmentId`).
3. **Multi-Tenancy Scoping**: Every query filters by `tenantId` and `campusId`.
