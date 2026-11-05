# CCMS System Architecture & Design Specification

## Overview

The Campus Management & Complaint System (CCMS) is structured as an Enterprise Modular Monolith. It segregates domain concerns cleanly, enforces strict clean-architecture boundaries, and utilizes an event-driven data pipeline for analytics and Power BI reporting.

```
[ Frontend: React + Vite ]
         │
         │ REST API (/api/v1/...)
         ▼
[ Security Layer: Auth / RBAC ]
         │
         ▼
[ Clean Domain Layer (auth, complaints, workflow, analytics, etc.) ]
         │
         ├──► [ Event Bus: Domain Events (ComplaintCreated, etc.) ]
         │         │
         │         ▼
         │   [ Event Handlers / Notifications / Audit / Schedulers ]
         │         │
         │         ▼
         │   [ Denormalized Reporting Data Marts ]
         │         │
         │         ▼
         │   [ Power BI Engine & Reports ]
         │
         ▼
[ Infrastructure Providers: Mail, AI, Storage, Redis Cache, MongoDB ]
```

## Core Layers
1. **API Router Layer (`backend/src/api/v1/`)**: Handles versioned routing and request mapping.
2. **Security Layer (`backend/src/security/`)**: Validates authentication tokens (JWT) and evaluates RBAC/ABAC authorization policies.
3. **Shared Kernel (`backend/src/shared/`)**: Standardized error responses, constants, validators, DTOs, and utility helpers.
4. **Domain Services & Workflows (`backend/src/domains/`)**: Contains core domain logic, complaint state machines, and business rules.
5. **Infrastructure Abstractions (`backend/src/infrastructure/`)**: Pluggable providers for Email, SMS, Storage, AI, Caching, and Queues.
