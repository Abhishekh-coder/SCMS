# 📜 CCMS Domain Event Contract Catalog (v1.0)

This catalog formalizes all domain events published across the Campus Management & Complaint System (CCMS). All domain events act as frozen, versioned public contracts that decouple domain aggregates from background subscribers (Notifications, Power BI Analytics, Audit, AI Triage).

---

## 1. Event Envelope Architecture

Every event emitted by `EventPublisher` strictly conforms to the standard event envelope:

```json
{
  "eventId": "evt_1785764587804_90qc2nw",
  "eventType": "ComplaintSubmitted",
  "eventVersion": 1,
  "producer": "ComplaintAggregate",
  "timestamp": "2026-08-03T19:13:07.804Z",
  "payload": { ... }
}
```

---

## 2. IAM Domain Event Contracts

### 2.1 `UserRegistered`
- **Producer**: `IdentityOrchestrator`
- **Subscribers**: `EmailVerificationSubscriber`, `NotificationOrchestrator`
- **Payload Schema**:
```json
{
  "userUuid": "String (UUID v4)",
  "email": "String (lowercase)",
  "fullName": "String",
  "role": "String",
  "occurredAt": "String (ISO 8601)"
}
```

### 2.2 `UserLoggedIn`
- **Producer**: `AuthenticationPipeline`
- **Subscribers**: `PowerBILoginFactSubscriber`, `AuditService`
- **Payload Schema**:
```json
{
  "userUuid": "String (UUID v4)",
  "email": "String",
  "ipAddress": "String",
  "userAgent": "String",
  "occurredAt": "String (ISO 8601)"
}
```

### 2.3 `TokenReplayDetected`
- **Producer**: `TokenService`
- **Subscribers**: `SecurityAlertSubscriber`, `AuditService`
- **Payload Schema**:
```json
{
  "familyId": "String (UUID v4)",
  "userUuid": "String (UUID v4)",
  "ipAddress": "String",
  "occurredAt": "String (ISO 8601)"
}
```

---

## 3. Master Data Domain Event Contracts

### 3.1 `MasterDataUpdated`
- **Producer**: `RelationshipService`, `MasterDataController`
- **Subscribers**: `ReferenceDataService` (Cache Invalidation)
- **Payload Schema**:
```json
{
  "domain": "String (e.g. 'depts_tenant_campus_01', 'relationships')",
  "relationshipType": "String (Optional)",
  "sourceId": "String (Optional)",
  "targetId": "String (Optional)",
  "occurredAt": "String (ISO 8601)"
}
```

---

## 4. Complaint Aggregate Domain Event Contracts

### 4.1 `ComplaintSubmitted`
- **Producer**: `ComplaintAggregate`
- **Subscribers**: `PowerBIComplaintFactSubscriber`, `NotificationOrchestrator`
- **Payload Schema**:
```json
{
  "complaintUuid": "String (UUID v4)",
  "complaintCode": "String (e.g. CMP-2026-CSE-100201)",
  "userUuid": "String (UUID v4)",
  "departmentCode": "String",
  "priority": "String (LOW | MEDIUM | HIGH | CRITICAL)",
  "resolutionSlaDeadline": "String (ISO 8601)",
  "occurredAt": "String (ISO 8601)"
}
```

### 4.2 `ComplaintResolved`
- **Producer**: `ComplaintAggregate`
- **Subscribers**: `PowerBIComplaintFactSubscriber`, `NotificationOrchestrator`
- **Payload Schema**:
```json
{
  "complaintUuid": "String (UUID v4)",
  "complaintCode": "String",
  "previousState": "String",
  "newState": "RESOLVED",
  "actorUuid": "String (UUID v4)",
  "occurredAt": "String (ISO 8601)"
}
```

---

## 5. Notification Domain Event Contracts

### 5.1 `NotificationSent`
- **Producer**: `NotificationOrchestrator`
- **Subscribers**: `PowerBINotificationFactSubscriber`
- **Payload Schema**:
```json
{
  "notificationUuid": "String (UUID v4)",
  "userUuid": "String (UUID v4)",
  "channel": "String (IN_APP | EMAIL | SMS | WHATSAPP | PUSH)",
  "priority": "String (LOW | NORMAL | HIGH | CRITICAL)",
  "status": "String (DELIVERED | FAILED)",
  "occurredAt": "String (ISO 8601)"
}
```
