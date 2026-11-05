# Power BI Integration & Data Mart Pipeline Specification

## Operational Data Pipeline Architecture

```
Operational Collections (complaints, faculty, students)
          │
          ▼
   Domain Event Bus (ComplaintCreated, ComplaintResolved)
          │
          ▼
Aggregation Scheduler Jobs (scheduler/snapshots)
          │
          ▼
Denormalized Reporting Data Mart Collections:
  ├── reportingComplaintFact
  ├── reportingFacultyFact
  ├── reportingStudentFact
  └── reportingDailySnapshot
          │
          ▼
Power BI REST API / Direct Connector / PBIX Template
```

## Analytics Measures & KPI Dashboards
- **Resolution Rate**: % of complaints resolved within standard SLA window.
- **Average Turnaround Time (TAT)**: Time in hours from submission to resolution.
- **Department SLA Compliance Index**: Heatmap visual across academic & administrative departments.
- **Escalation Frequency**: Rate of complaints escalating to HOD / Dean.
