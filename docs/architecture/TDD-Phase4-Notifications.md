# 📘 Phase 4 – Communication & Notification Platform Technical Design Document (TDD v4.0)

---

## 1. Architectural Strategy & Notification Orchestrator

Phase 4 establishes an enterprise-grade, multi-channel **NotificationOrchestrator** that decouples domain events from delivery channels (Email, In-App Notifications, Real-time Socket.io, SMS/WhatsApp):

```
Domain Event (ComplaintAssigned, SLAWarning, UserRegistered)
       │
       ▼
[ NotificationOrchestrator ]
       │
 ├───────► RecipientResolver (Fetch User & Profile Details)
 ├───────► TemplateEngine (Compile Handlebars-style templates with variables)
 ├───────► PreferenceFilter (Validate User Channel Opt-in/Opt-out settings)
 ├───────► Multi-Channel Delivery Engine:
 │          ├── InAppNotificationStore (DB Record & Socket.io Live Push)
 │          └── EmailProvider (SMTP Mailer Abstraction)
 └───────► DeliveryTracker & Power BI Mart Ingestion (reportingNotificationFact)
```

---

## 2. Notification Data Schemas

### 2.1 `notifications` Collection (In-App Store)
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `notificationUuid` | String | Yes | Generated | Valid UUID v4 |
| `userUuid` | String | Yes | None | Target user recipient UUID (Indexed) |
| `title` | String | Yes | None | Short notification header title |
| `body` | String | Yes | None | Full formatted message text |
| `type` | String | Yes | `INFO` | Enum: `['INFO', 'SUCCESS', 'WARNING', 'URGENT']` |
| `channel` | String | Yes | `IN_APP` | Enum: `['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP']` |
| `readStatus` | Boolean | Yes | `false` | Read / Unread status flag (Indexed) |
| `readAt` | Date | No | Null | Timestamp when user marked notification read |
| `actionUrl` | String | No | Null | Deep link URL to open specific complaint (e.g. `/complaints/cmp_123`) |

---

### 2.2 `notificationTemplates` Collection
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `templateCode` | String | Yes | None | Unique code (e.g. `COMPLAINT_ASSIGNED_EMAIL`) |
| `channel` | String | Yes | `EMAIL` | Enum: `['EMAIL', 'IN_APP', 'SMS']` |
| `subjectTemplate` | String | No | Null | Template for email subject line |
| `bodyTemplate` | String | Yes | None | Body template string containing `{{variables}}` |
| `variables` | Array[String] | Yes | `[]` | List of expected template variables |

---

### 2.3 `notificationPreferences` Collection
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `userUuid` | String | Yes | None | User UUID (Unique Index) |
| `emailNotifications` | Boolean | Yes | `true` | Opt-in flag for email alerts |
| `inAppNotifications` | Boolean | Yes | `true` | Opt-in flag for in-app center alerts |
| `slaAlerts` | Boolean | Yes | `true` | Opt-in flag for SLA warning reminders |
| `dailyDigest` | Boolean | Yes | `false` | Opt-in flag for consolidated daily emails |

---

## 3. Dynamic Template Compilation Engine (`TemplateEngine`)

The template engine compiles dynamic variables using regex parameter substitution:

```javascript
// Input Template: "Hello {{studentName}}, your complaint {{complaintCode}} has been assigned to {{assignedTo}}."
// Context: { studentName: "Ananya Verma", complaintCode: "CMP-2026-CSE-100201", assignedTo: "Dr. Suresh Kumar" }
// Output: "Hello Ananya Verma, your complaint CMP-2026-CSE-100201 has been assigned to Dr. Suresh Kumar."
```

Supported Variables:
- `{{studentName}}`, `{{userCode}}`, `{{email}}`
- `{{complaintCode}}`, `{{title}}`, `{{category}}`, `{{status}}`, `{{priority}}`
- `{{assignedTo}}`, `{{departmentName}}`
- `{{slaDeadline}}`, `{{slaRemainingHours}}`

---

## 4. Real-Time Socket.io Live Push Integration

When an in-app notification is stored:
1. Document is saved into `notifications` collection.
2. `socket.io` server emits live event to room `user:${userUuid}`:
   ```javascript
   io.to(`user:${userUuid}`).emit('notification:new', {
     notificationUuid: savedDoc.notificationUuid,
     title: savedDoc.title,
     body: savedDoc.body,
     type: savedDoc.type,
     actionUrl: savedDoc.actionUrl,
     createdAt: savedDoc.createdAt
   });
   ```

---

## 5. Power BI Reporting Ingestion (`reportingNotificationFacts`)

Every delivery attempt emits facts into `reportingNotificationFacts`:
- `dateKey` (Integer `YYYYMMDD`)
- `userUuid` (String)
- `channel` (`EMAIL` / `IN_APP`)
- `type` (`INFO` / `WARNING` / `URGENT`)
- `status` (`DELIVERED` / `FAILED`)
