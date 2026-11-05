# 📘 Phase 5 – Analytics & Reporting Platform Technical Design Document (TDD v5.0)

---

## 1. Executive Summary & Architectural Vision

The **Analytics & Reporting Platform** transforms CCMS operational events into structured Star Schema data marts, reusable KPI metrics, and role-scoped executive dashboards. Operational MongoDB collections are strictly isolated from analytical aggregation queries to guarantee zero performance impact on core business transactions:

```
Domain Events (ComplaintSubmitted, ComplaintResolved, NotificationSent)
       │
       ▼
[ AnalyticsEngine ]
       │
 ├───────► Star Schema Fact Collections:
 │          ├── ReportingComplaintFact (Status, Durations)
 │          ├── ReportingAssignmentFact (Workload Distribution)
 │          ├── ReportingSLAFact (SLA Compliance, Breaches)
 │          └── ReportingNotificationFact (Channel Deliveries)
 │
 ├───────► KPI Calculation Engine:
 │          ├── Average Resolution Time (Hours)
 │          ├── SLA Compliance Rate (%)
 │          ├── Escalation Rate (%)
 │          └── Reopen Rate (%)
 │
 └───────► Role-Based Dashboard APIs:
            ├── Student Dashboard (`GET /analytics/dashboards/student`)
            ├── Faculty Dashboard (`GET /analytics/dashboards/faculty`)
            ├── HOD Dashboard (`GET /analytics/dashboards/hod`)
            ├── Dean Dashboard (`GET /analytics/dashboards/dean`)
            └── Principal Dashboard (`GET /analytics/dashboards/principal`)
```

---

## 2. Star Schema Data Mart Collections

### 2.1 `reportingComplaintFacts` Collection
| Field | Type | Required | Description |
|---|---|---|---|
| `dateKey` | Number | Yes | Integer date key `YYYYMMDD` (e.g. `20260803`) |
| `complaintUuid` | String | Yes | Complaint UUID (Indexed) |
| `complaintCode` | String | Yes | Human-readable code (e.g. `CMP-2026-CSE-100201`) |
| `userUuid` | String | Yes | Student creator UUID (Indexed) |
| `departmentCode` | String | Yes | Target department code (Indexed) |
| `categoryCode` | String | Yes | Primary category code |
| `priority` | String | Yes | Enum: `['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']` |
| `status` | String | Yes | Enum: `['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED']` |
| `resolutionDurationHours` | Number | No | Total hours from submission to resolution |
| `slaBreached` | Boolean | Yes | Flag indicating whether resolution missed SLA deadline |

---

### 2.2 `reportingSlaFacts` Collection
| Field | Type | Required | Description |
|---|---|---|---|
| `dateKey` | Number | Yes | Integer date key `YYYYMMDD` |
| `complaintUuid` | String | Yes | Complaint UUID (Indexed) |
| `departmentCode` | String | Yes | Target department code (Indexed) |
| `slaHours` | Number | Yes | Configured SLA threshold hours |
| `actualResolutionHours` | Number | No | Actual hours taken to resolve |
| `slaStatus` | String | Yes | Enum: `['ON_TIME', 'BREACHED', 'PENDING']` |

---

## 3. KPI Calculation Formulas

1. **SLA Compliance Rate (%)**:
   $$\text{SLA Compliance \%} = \left( \frac{\text{Count}(\text{slaStatus} = \text{'ON\_TIME'})}{\text{Count}(\text{Total Resolved Complaints})} \right) \times 100$$
2. **Average Resolution Time (Hours)**:
   $$\text{Avg Resolution Hours} = \frac{\sum \text{resolutionDurationHours}}{\text{Count}(\text{Total Resolved Complaints})}$$
3. **Escalation Rate (%)**:
   $$\text{Escalation \%} = \left( \frac{\text{Count}(\text{status} = \text{'ESCALATED'})}{\text{Count}(\text{Total Complaints})} \right) \times 100$$
4. **Reopen Rate (%)**:
   $$\text{Reopen \%} = \left( \frac{\text{Count}(\text{status} = \text{'REOPENED'})}{\text{Count}(\text{Total Resolved Complaints})} \right) \times 100$$

---

## 4. Role-Based Dashboard API Scoping

### 4.1 `GET /api/v1/analytics/dashboards/student`
- **Scope**: Filtered strictly to `req.user.userUuid`.
- **Metrics Returned**: Total complaints submitted, active complaints, resolved complaints, SLA status breakdown.

### 4.2 `GET /api/v1/analytics/dashboards/faculty`
- **Scope**: Filtered to complaints assigned to `req.user.userUuid`.
- **Metrics Returned**: Pending actions, today's workload, average resolution time, pending SLA countdowns.

### 4.3 `GET /api/v1/analytics/dashboards/hod`
- **Scope**: Filtered to `req.user.profileContext.departmentId`.
- **Metrics Returned**: Department SLA %, escalation count, faculty workload distribution, Category trends.

### 4.4 `GET /api/v1/analytics/dashboards/dean` & `/principal`
- **Scope**: Cross-department campus-wide executive metrics.
- **Metrics Returned**: Campus SLA ranking, department performance comparison, total complaint volume trend, high-severity alerts.
