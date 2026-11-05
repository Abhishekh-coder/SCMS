# Campus Complaint Management System (CCMS)

A production-grade, enterprise modular monolith web application designed for higher education campuses to streamline complaint registration, automated routing, SLA management, resolution workflows, and real-time Power BI analytics.

---

## 🏛 Architecture Overview

CCMS follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles in a modular monolith structure:

- **Frontend**: React + Vite + TailwindCSS / Custom Design System + Zustand State Management.
- **Backend**: Node.js + Express + Clean Architecture + Provider Abstractions.
- **Database**: MongoDB (Transactional Collections + Denormalized Data Mart Reporting Collections).
- **Analytics**: Power BI Integration with optimized Reporting Collections (`reportingComplaintFact`, `reportingDailySnapshot`, etc.).
- **Security**: Authentication (JWT + Refresh Tokens) + Authorization (RBAC / ABAC) in a dedicated Security layer.
- **Event Bus**: Asynchronous decoupled domain events (`ComplaintCreated`, `ComplaintEscalated`, `ComplaintResolved`, etc.).
- **Workflow Engine**: Rule-based state transition engine for automated routing, escalations, and SLA enforcement.

---

## 📁 Repository Structure

```
CCMS/
├── architecture/               # ADRs, sequence diagrams, state machines, deployment specs
├── contracts/                  # Versioned OpenAPI specifications (auth.v1.yaml, complaint.v1.yaml)
├── docs/                       # Comprehensive system architecture & domain documentation
├── frontend/                   # React + Vite web application
├── backend/                    # Node.js + Express backend service
│   ├── src/
│   │   ├── api/v1/             # API Router mounts
│   │   ├── config/             # Backend-scoped configurations
│   │   ├── bootstrap/          # Application startup loaders & pipeline
│   │   ├── security/           # Authentication, authorization, RBAC policies & permissions
│   │   ├── shared/             # Shared kernel (errors, constants, DTOs, utils, validators)
│   │   ├── infrastructure/     # Pluggable provider wrappers (Notification, AI, Storage, Cache, Queue)
│   │   ├── domain/             # Enterprise business models & domain rules
│   │   ├── application/        # Application orchestrations & use cases
│   │   ├── domains/            # Feature domains (auth, complaints, workflow, analytics, etc.)
│   │   ├── events/             # Global Event Bus & Subscribers
│   │   ├── scheduler/          # Cron jobs & background tasks (SLA escalation, daily snapshot)
│   │   ├── featureFlags/       # Runtime feature toggle framework
│   │   └── monitoring/         # Operational, business, security & performance metrics
├── database/                   # Database schemas (28 collections), seeds, migrations, views, indexes
├── analytics/                  # Power BI PBIX files, measures, templates, datasets
├── storage/                    # Abstracted file storage (local, archive, processed, failed)
├── logs/                       # System, application, audit, and job execution logs
├── docker/                     # Dockerfiles & Nginx configurations
├── scripts/                    # Utilities & setup scripts
└── tests/                      # Unit, integration, security, and performance tests
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.0
- Redis >= 7.0

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/campus/ccms.git
   cd ccms
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Database Seeding**
   ```bash
   node scripts/seed.js
   ```

---

## 📜 ADR Summary

Detailed Architecture Decision Records can be found in `architecture/decisions/`:
- **ADR-001**: Choice of MongoDB with Analytical Reporting Collections
- **ADR-002**: Role-Based & Attribute-Based Access Control (RBAC/ABAC)
- **ADR-003**: Formal State-Machine Workflow Engine for Complaint Lifecycle
- **ADR-004**: Denormalized Data Mart Strategy for Power BI Integration
- **ADR-005**: Modular Monolith over Microservices for Phase 1
- **ADR-006**: Dual-Token JWT (Access + Refresh Tokens) Authentication
- **ADR-007**: Asynchronous Decoupled Event Bus Architecture
- **ADR-008**: Provider Abstractions for Notification, AI, and Object Storage

---

## 🔒 Security & Compliance

- All API endpoints strictly enforce `/api/v1/` versioning.
- Role-based permissions are enforced at controller and domain service layers.
- Multi-tenancy (`tenantId` & `campusId`) is integrated across schema definitions.
- Detailed audit logs track all sensitive operations.

---

## ⚖️ License
MIT License - see [LICENSE](LICENSE) file for full details.
