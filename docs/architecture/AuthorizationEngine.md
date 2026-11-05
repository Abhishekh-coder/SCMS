# 🛡️ CCMS Authorization Subsystem (RBAC / ABAC Policy Engine) Specification

---

## 1. Architectural Overview

The Campus Management & Complaint System (CCMS) authorization subsystem implements a multi-layered **AuthorizationEngine** combining static Role-Based Access Control (RBAC) permission codes with dynamic Attribute-Based Access Control (ABAC) policy rules:

```
Request (HTTP) ──► authenticateToken Middleware
                        │
                        ▼
            authorize("complaint:assign", { checkDepartment: true })
                        │
                        ▼
               AuthorizationEngine
                        │
 ├───────► PermissionProvider (Fast In-Memory Cache)
 ├───────► 1. Static Permission Code Check (resource:action)
 ├───────► 2. Tenant Isolation Policy (user.tenantId === resource.tenantId)
 ├───────► 3. Campus Isolation Policy (user.campusId === resource.campusId)
 ├───────► 4. Ownership Policy (checkOwnership: user.userUuid === resource.ownerUuid)
 ├───────► 5. Department Policy (checkDepartment: user.dept === resource.dept)
 └───────► 6. SYSTEM_ADMIN Override Policy
                        │
                        ▼
            Decision: ALLOW (true) / DENY (false)
```

---

## 2. Resource + Action Permission Catalog

All permission codes strictly follow the `resource:action` format:

| Module | Permission Code | Description |
|---|---|---|
| `complaints` | `complaint:create` | Create a new complaint |
| `complaints` | `complaint:view_own` | View complaints created by self |
| `complaints` | `complaint:view_department` | View complaints assigned to own department |
| `complaints` | `complaint:assign` | Assign complaint to faculty or department handler |
| `complaints` | `complaint:escalate` | Escalate unresolved complaint to higher authority |
| `complaints` | `complaint:resolve` | Resolve assigned complaint |
| `complaints` | `complaint:reopen` | Reopen a resolved complaint |
| `complaints` | `complaint:close` | Close complaint after verification |
| `complaints` | `complaint:delete` | Soft delete complaint |
| `analytics` | `analytics:view` | Access Power BI analytics and reporting dashboards |
| `users` | `user:manage` | Manage user profiles and account statuses |
| `auth` | `role:assign` | Assign or revoke user system roles |
| `workflow` | `workflow:configure` | Configure complaint workflow state transitions and SLA timers |

---

## 3. PermissionProvider Caching Architecture

To prevent database latency on every request, `PermissionProvider` caches the user's aggregated permissions, active roles, and profile context in memory:

```
authorize Middleware
        │
        ▼
PermissionProvider.getUserPermissions(user)
        │
        ├── Cache Hit (Valid TTL) ──► Return Cached Permissions Set (< 0.5 ms)
        │
        └── Cache Miss / Eviction ──► Query UserRole + Role Collections from MongoDB
                                      ├── Filter Expired Roles (expiresAt)
                                      ├── Fetch Profile Context (DepartmentId, RollNumber, EmployeeId)
                                      └── Cache Entry with 10-Minute TTL
```

### Invalidation Triggers
- `UserRoleService.assignRoleToUser()` -> invokes `permissionProvider.clearUserCache(userId)`.
- `UserRoleService.revokeRoleFromUser()` -> invokes `permissionProvider.clearUserCache(userId)`.

---

## 4. Multi-Role Support & Role Assignment APIs

Users support multiple concurrent role assignments (e.g. `FACULTY` + `CLASS_INCHARGE` + `PLACEMENT_COORDINATOR`).
Role assignments support temporary expiration (`expiresAt`), automatically filtered out when expired.
