# 📊 Power BI Data Dictionary & Star Schema Mapping (CCMS v1.0)

---

## 1. Star Schema Overview

```
                      ┌─────────────────────────┐
                      │   DimDate (Time Dim)    │
                      └────────────┬────────────┘
                                   │
 ┌─────────────────────────┐       │       ┌─────────────────────────┐
 │     DimDepartment       │───────┼───────│       DimCategory       │
 └─────────────────────────┘       │       └─────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │   reportingComplaintFacts   │ (Fact Table)
                    └──────────────┬──────────────┘
                                   │
 ┌─────────────────────────┐       │       ┌─────────────────────────┐
 │       DimFaculty        │───────┴───────│       DimCampus         │
 └─────────────────────────┘               └─────────────────────────┘
```

---

## 2. Fact Table Specifications

### 2.1 `reportingComplaintFacts`
- **Primary Key**: `complaintUuid`
- **Foreign Keys**: `dateKey` -> `DimDate.dateKey`, `departmentCode` -> `DimDepartment.departmentCode`, `userUuid` -> `DimStudent.userUuid`
- **Measures**:
  - `[Total Complaints]` = `COUNT(reportingComplaintFacts[complaintUuid])`
  - `[Resolved Complaints]` = `CALCULATE([Total Complaints], reportingComplaintFacts[status] = "RESOLVED")`
  - `[Avg Resolution Hours]` = `AVERAGE(reportingComplaintFacts[resolutionDurationHours])`
  - `[SLA Compliance %]` = `DIVIDE(CALCULATE([Resolved Complaints], reportingComplaintFacts[slaBreached] = FALSE), [Resolved Complaints], 1) * 100`

---

### 2.2 `reportingSlaFacts`
- **Primary Key**: `complaintUuid`
- **Foreign Keys**: `dateKey`, `departmentCode`
- **Measures**:
  - `[SLA Breached Count]` = `CALCULATE([Total Complaints], reportingSlaFacts[slaStatus] = "BREACHED")`
  - `[SLA Breach %]` = `DIVIDE([SLA Breached Count], [Total Complaints], 0) * 100`
