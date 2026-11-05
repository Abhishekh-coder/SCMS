# 📊 CCMS Database Index Strategy Document (Phase 1 – IAM & Beyond)

This document formalizes the indexing strategy for the Campus Management & Complaint System (CCMS) MongoDB database to guarantee sub-millisecond query performance, enforce data integrity, and support multi-tenant isolation.

---

## 1. Naming & Index Principles

1. **CamelCase Conventions**: All index field targets must strictly adhere to `camelCase` field naming (e.g. `userUuid`, `tenantId`, `campusId`).
2. **Multi-Tenancy Key Prepending**: All query-heavy collections include `{ tenantId: 1, campusId: 1 }` as leading compound index keys where tenant-scoped isolation is queried.
3. **Soft Delete Awareness**: Queries filtering active records include `{ isDeleted: false }`. Indexes compound with `isDeleted` to prevent index scans on archived data.

---

## 2. Sprint 1 Index Strategy Matrix

### 2.1 `users` Collection
| Collection | Index Specification | Type | Unique | Purpose / Served Query Pattern |
|---|---|---|---|---|
| `users` | `{ email: 1 }` | Single Field | **Yes** | Primary user login authentication & duplicate checks |
| `users` | `{ userUuid: 1 }` | Single Field | **Yes** | Public/External API lookups & cross-domain reference |
| `users` | `{ userCode: 1 }` | Single Field | **Yes** | Human-readable ID lookup (e.g. `STU-100001`, `EMP-90012`) |
| `users` | `{ tenantId: 1, campusId: 1, accountStatus: 1 }` | Compound | No | Multi-tenant admin filtering by account status |
| `users` | `{ phone: 1 }` | Sparse Single Field | No | Secondary contact lookup & SMS notification routing |
| `users` | `{ tenantId: 1, isDeleted: 1 }` | Compound | No | Filtering active vs soft-deleted users per tenant |

---

### 2.2 `roles` Collection
| Collection | Index Specification | Type | Unique | Purpose / Served Query Pattern |
|---|---|---|---|---|
| `roles` | `{ code: 1 }` | Single Field | **Yes** | Programmatic role code lookup (`STUDENT`, `FACULTY`, `DEPT_HEAD`) |
| `roles` | `{ name: 1 }` | Single Field | **Yes** | Display role name validation |

---

### 2.3 `permissions` Collection
| Collection | Index Specification | Type | Unique | Purpose / Served Query Pattern |
|---|---|---|---|---|
| `permissions` | `{ code: 1 }` | Single Field | **Yes** | Permission authorization evaluation (e.g. `complaint:create`) |
| `permissions` | `{ module: 1 }` | Single Field | No | Module-level permission grouping and UI capability matrix |

---

### 2.4 `userRoles` Collection (Junction)
| Collection | Index Specification | Type | Unique | Purpose / Served Query Pattern |
|---|---|---|---|---|
| `userRoles` | `{ userId: 1, roleId: 1 }` | Compound | **Yes** | Fast user role evaluation & duplicate assignment prevention |
| `userRoles` | `{ roleId: 1 }` | Single Field | No | Reverse lookup of all users assigned to a specific role |
| `userRoles` | `{ expiresAt: 1 }` | TTL | No | Automatic expiration cleanup of temporary role assignments |

---

### 2.5 `studentProfiles` Collection
| Collection | Index Specification | Type | Unique | Purpose / Served Query Pattern |
|---|---|---|---|---|
| `studentProfiles` | `{ userId: 1 }` | Single Field | **Yes** | 1-to-1 linkage to `users._id` |
| `studentProfiles` | `{ userUuid: 1 }` | Single Field | **Yes** | 1-to-1 linkage to `users.userUuid` |
| `studentProfiles` | `{ rollNumber: 1 }` | Single Field | **Yes** | Academic student roll number lookup |
| `studentProfiles` | `{ tenantId: 1, branch: 1, semester: 1 }` | Compound | No | Departmental / Class complaint routing and filtering |

---

### 2.6 `facultyProfiles` Collection
| Collection | Index Specification | Type | Unique | Purpose / Served Query Pattern |
|---|---|---|---|---|
| `facultyProfiles` | `{ userId: 1 }` | Single Field | **Yes** | 1-to-1 linkage to `users._id` |
| `facultyProfiles` | `{ userUuid: 1 }` | Single Field | **Yes** | 1-to-1 linkage to `users.userUuid` |
| `facultyProfiles` | `{ employeeId: 1 }` | Single Field | **Yes** | Faculty employee code lookup |
| `facultyProfiles` | `{ tenantId: 1, departmentId: 1 }` | Compound | No | Departmental faculty listing and HOD routing |

---

### 2.7 `adminProfiles` Collection
| Collection | Index Specification | Type | Unique | Purpose / Served Query Pattern |
|---|---|---|---|---|
| `adminProfiles` | `{ userId: 1 }` | Single Field | **Yes** | 1-to-1 linkage to `users._id` |
| `adminProfiles` | `{ userUuid: 1 }` | Single Field | **Yes** | 1-to-1 linkage to `users.userUuid` |
| `adminProfiles` | `{ tenantId: 1, adminLevel: 1 }` | Compound | No | Governance level lookup (`SYSTEM_ADMIN`, `DEPARTMENT_ADMIN`) |

---

## 3. Phase 1 Later Sprints Index Matrix (Reference)

| Collection | Index Specification | Type | Purpose |
|---|---|---|---|
| `sessions` | `{ sessionUuid: 1 }` | Unique Single Field | Session token verification |
| `sessions` | `{ userId: 1, revokedAt: 1 }` | Compound | Active user sessions lookup |
| `refreshTokens` | `{ token: 1 }` | Unique Single Field | Refresh token rotation validation |
| `refreshTokens` | `{ familyId: 1 }` | Single Field | Replay attack family revocation |
| `otps` | `{ userUuid: 1, purpose: 1 }` | Compound | User OTP verification lookup |
| `otps` | `{ expiresAt: 1 }` | TTL (Index) | Automatic deletion of expired OTP codes |
| `auditLogs` | `{ timestamp: -1, eventType: 1 }` | Compound | Security audit chronologic search |
| `reportingLoginFacts` | `{ dateKey: 1, department: 1 }` | Compound | Power BI analytical slicing |

---

## 4. Index Maintenance & Performance Guidelines

1. **Write Overhead Balance**: Maximum 5 indexes per transactional collection to preserve sub-10ms write throughput.
2. **ESLint / Mongoose Sync Verification**: Run `node --test tests/unit/schemas.test.js` to ensure index builds match schema declarations.
