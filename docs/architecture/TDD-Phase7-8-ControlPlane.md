# 📘 Phase 7 & 8 – Control Plane, Governance & Production Hardening Technical Design Document (TDD v7.0)

---

## 1. Architectural Overview & Control Plane Pattern

Phases 7 & 8 introduce the **CCMS Control Plane**, shifting the application from feature building into production governance, dynamic feature flags, health diagnostics, containerization, and rate-limited security hardening:

```
                     ┌─────────────────────────────────────────┐
                     │          CCMS Presentation Layer        │
                     │ React Frontend • Design System • Mobile │
                     └────────────────────┬────────────────────┘
                                          │
 ┌────────────────────────────────────────┴────────────────────────────────────────┐
 ▼                                                                                 ▼
[ API Control Plane & Security Middleware ]                              [ Production Hardening ]
  ├── Feature Flag Engine (Runtime Toggle)                                ├── Rate Limiter & Helmet
  ├── System Configuration Store                                          ├── Docker & Nginx Reverse Proxy
  ├── Health Monitoring & Diagnostics (`/health`, `/metrics`)             └── CI/CD GitHub Actions Workflow
  └── Audit & Governance Ledger
                                          │
                                          ▼
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │ Domain Layer: IAM • Master Data • Complaint Engine • Notifications • Analytics │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Feature Flag & System Configuration Engine

### 2.1 `featureFlags` Collection
| Field | Type | Required | Description |
|---|---|---|---|
| `flagCode` | String | Yes | Unique flag code (e.g. `AI_TRIAGE_ENABLED`, `NOTIFICATIONS_ENABLED`, `WHATSAPP_ENABLED`) |
| `name` | String | Yes | Display title |
| `description` | String | Yes | Description of feature scope |
| `isEnabled` | Boolean | Yes | Runtime status flag (Indexed) |
| `targetTenants` | Array[String] | Yes | Tenant filter array (`[]` = all tenants) |

---

### 2.2 `systemConfigs` Collection
| Field | Type | Required | Description |
|---|---|---|---|
| `configKey` | String | Yes | Configuration key (e.g. `JWT_EXPIRE_MINUTES`, `OTP_EXPIRE_MINUTES`, `MAX_FILE_SIZE_MB`) |
| `configValue` | Mixed | Yes | Setting value |
| `category` | String | Yes | Category enum: `['AUTH', 'SECURITY', 'STORAGE', 'AI', 'NOTIFICATION']` |

---

## 3. System Diagnostics & Health Scanner

The `HealthCheckService` evaluates core components and exposes status at `GET /api/v1/admin/health`:

- **MongoDB Status**: Connection state (`CONNECTED` / `DISCONNECTED`) & latency.
- **Notification Queue**: Pending jobs count & processing status.
- **Event Publisher**: Active listener count.
- **AI Infrastructure**: Gemini Provider availability.

---

## 4. Containerization & DevOps Pipeline

- **`Dockerfile`**: Multi-stage Node.js build for security and minimized layer sizes.
- **`docker-compose.yml`**: Orchestrates `ccms-backend`, `ccms-mongodb`, and `ccms-nginx`.
- **`.github/workflows/ci.yml`**: Continuous Integration testing pipeline running linting, build verification, and full automated test suite.
