# CCMS Database Schema & Data Mart Specifications

## Database Architecture
MongoDB serves as the core persistence store. To ensure multi-tenancy and high-performance analytical reporting, the collection architecture is divided into Operational Collections and Denormalized Reporting Collections.

## Collection List (28 Total)

### Operational Collections
1. `users` - Base user accounts and security profile
2. `roles` - Defined roles (Admin, Student, Faculty, Warden, Registrar, HOD)
3. `permissions` - Fine-grained capability definitions
4. `students` - Student specific profile details, branch, hostel block
5. `faculty` - Faculty profile details, designation, department mapping
6. `departments` - Academic & Administrative department entities
7. `courses` - Campus course listings
8. `semesters` - Academic terms & schedules
9. `divisions` - Class divisions / sections
10. `complaints` - Core transactional complaint records with multi-tenancy fields (`tenantId`, `campusId`)
11. `complaintTimeline` - Immutable audit log of status state transitions
12. `complaintAssignments` - Historical record of staff assignments & escalation paths
13. `complaintAttachments` - Metadata for uploaded documents, photos, audio
14. `complaintComments` - Discussion thread entries between student & department staff
15. `notifications` - In-app notification queue
16. `emails` - Outbound email execution logs
17. `auditLogs` - System-wide audit trail for compliance
18. `activityLogs` - Detailed user activity stream
19. `workflowDefinitions` - Declarative workflow state machine configurations
20. `workflowInstances` - Active workflow instance state trackers
21. `settings` - Tenant & system configuration toggles
22. `loginHistory` - Audit trail of authentication attempts & IP metrics
23. `refreshTokens` - Active refresh token whitelist & revocation store
24. `otp` - One-Time Password verification tokens
25. `sessions` - Active user sessions
26. `reCaptchaLogs` - Bot protection verification log
27. `aiSuggestions` - AI suggested resolutions and auto-categorization records

### Reporting Data Mart Collections (Power BI Integration)
28. `reportingComplaintFact` - Pre-aggregated complaint metric fact table
29. `reportingFacultyFact` - Pre-computed faculty resolution workload & turnaround metrics
30. `reportingStudentFact` - Student complaint frequency data
31. `reportingDailySnapshot` - Daily snapshot aggregations feeding Power BI trend visuals
32. `powerBiExports` - Tracked data dump exports and sync metrics
