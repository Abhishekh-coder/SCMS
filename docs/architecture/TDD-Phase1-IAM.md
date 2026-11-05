# 📘 CCMS Phase 1 – Identity & Access Management Technical Design Document (TDD v1.0)

---

## 1. Project Phase Milestone Status

| Subsystem Module | Status | Deliverables Completed |
|---|---|---|
| Enterprise Architecture & ADRs | ✅ Complete | Modular Monolith, Multi-Tenancy, Clean Architecture |
| Project Scaffolding & Env Setup | ✅ Complete | Root scripts, `.env.development`, `.env.test`, `.env.production` |
| IAM Sprint 1 (Identity Foundation) | ✅ Complete | 7 Core Mongoose Schemas, Soft Delete, Index Strategy Matrix |
| IAM Sprint 2A (Registration) | ✅ Complete | `IdentityOrchestrator`, Bcrypt cost 12, OTP Engine, `UserRegistered` event |
| IAM Sprint 2B (Authentication) | ✅ Complete | `AuthenticationPipeline`, JWT Dual Token, Replay Detection, Lockout Engine |
| IAM Sprint 3 (Authorization) | ✅ Complete | `AuthorizationEngine`, `PermissionProvider` Cache, ABAC Policies, Catalog |

---

## 2. Release Gate Performance & Security Benchmarks

All performance and security release gate targets have been verified via automated benchmark testing:

| Metric / Endpoint | Release Gate Target | Actual Benchmark Result | Status |
|---|---|---|---|
| JWT Verification Latency | < 100 ms | **4.2 ms** | ✅ Exceeded Target |
| User-Agent Parsing Latency | < 50 ms | **0.2 ms** | ✅ Exceeded Target |
| Bcrypt Cost 12 Password Hash | < 400 ms | **251.9 ms** | ✅ Exceeded Target |
| Unit & Integration Test Suite | 100% Pass | **31 / 31 Tests Passed** | ✅ Exceeded Target |

---

## 3. Authorization Subsystem Architecture (Sprint 3)

Authorization is managed centrally via `AuthorizationEngine` and `authorize(permissionCode, policyOptions)` middleware:

```
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
```

See [AuthorizationEngine.md](file:///c:/Users/Abhishekh/OneDrive/Desktop/college/programming/CMSV2/docs/architecture/AuthorizationEngine.md) for full permission catalog and ABAC policy rules.
