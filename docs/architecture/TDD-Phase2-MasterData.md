# 🏛️ CCMS Phase 2 – College Master Data (Foundation) Technical Design Document (TDD v2.0)

---

## 1. Architectural Principles & `ReferenceDataService`

Phase 2 establishes the digital organizational model for the campus, eliminating hardcoded string checks (`if (dept === "IT")`) across CCMS modules:

```
Complaint Module / Workflow Engine / RBAC Policy Engine
                           │
                           ▼
                 ReferenceDataService (Cached)
                           │
 ├─────────────────────────┼─────────────────────────┐
 ▼                         ▼                         ▼
Organization Master       Academic Master           Complaint Reference Data
(Campus, Building, Dept)  (Program, Semester, Div)  (Categories, SLA, Priority)
```

---

## 2. Core Architectural Refinements

1. **Master Data Versioning & Temporal History**:
   - Fields: `version` (Number), `effectiveFrom` (Date), `effectiveTo` (Date), `isCurrent` (Boolean).
   - Guarantees historical complaints retain reference integrity when master entities are renamed or re-versioned.
2. **Soft Status Lifecycle**:
   - `status`: `['ACTIVE', 'INACTIVE', 'ARCHIVED']`. Physical deletes are strictly prohibited.
3. **External Business Codes**:
   - All master entities use human-readable codes (`departmentCode`, `buildingCode`, `programCode`, `categoryCode`).
4. **Generic Relationship Engine (`masterRelationships`)**:
   - Unified collection mapping `sourceType`, `sourceId`, `relationshipType`, `targetType`, `targetId`.
   - Mappings supported: `HAS_HOD`, `HAS_CLASS_INCHARGE`, `HAS_TEACHER_GUARDIAN`, `HAS_DEAN`.
5. **Event-Driven Cache Invalidation**:
   - Subscribes to `MasterDataUpdated` events emitted when master records or relationships change, invalidating `ReferenceDataService` memory caches automatically.

---

## 3. Master Data Schemas

### 3.1 `masterDepartments` Collection
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `departmentCode` | String | Yes | None | Human-readable department code (e.g. `CSE`, `ECE`, `IT`) |
| `name` | String | Yes | None | Full department display name |
| `buildingCode` | String | No | Null | Associated campus building code |
| `version` | Number | Yes | 1 | Version counter for temporal tracking |
| `isCurrent` | Boolean | Yes | true | Current active version flag |
| `status` | String | Yes | `ACTIVE` | Enum: `['ACTIVE', 'INACTIVE', 'ARCHIVED']` |

---

### 3.2 `masterRelationships` Collection (Generic Engine)
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `sourceType` | String | Yes | None | Enum: `['DEPARTMENT', 'DIVISION', 'STUDENT', 'FACULTY']` |
| `sourceId` | String | Yes | None | Source entity key (e.g. `CSE` or `userUuid`) |
| `relationshipType` | String | Yes | None | Enum: `['HAS_HOD', 'HAS_CLASS_INCHARGE', 'HAS_TEACHER_GUARDIAN', 'HAS_DEAN']` |
| `targetType` | String | Yes | None | Enum: `['FACULTY', 'DEPARTMENT', 'BUILDING']` |
| `targetId` | String | Yes | None | Target entity key (e.g. Faculty `userUuid` or `employeeId`) |
| `status` | String | Yes | `ACTIVE` | Enum: `['ACTIVE', 'INACTIVE']` |

---

### 3.3 `masterComplaintMetadata` Collection
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `categoryCode` | String | Yes | None | Primary complaint category code (e.g. `ACADEMIC`, `HOSTEL`) |
| `subcategoryCode` | String | Yes | None | Subcategory code (e.g. `GRADING`, `MAINTENANCE`) |
| `defaultPriority` | String | Yes | `MEDIUM` | Enum: `['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']` |
| `slaHours` | Number | Yes | 48 | Resolution SLA threshold in hours |
| `escalationRoleCode` | String | Yes | `HOD` | Role code receiving auto-escalations |

---

## 4. Phase 2.5 Seed Data Roadmap

Initial seed data script `scripts/seedMasterData.js` populates default departments (`CSE`, `ECE`, `ME`, `CE`, `EE`, `IT`), building locations, and complaint categories with SLA policies.
