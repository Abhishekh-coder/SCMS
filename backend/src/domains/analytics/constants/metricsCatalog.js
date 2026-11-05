const METRICS_CATALOG = {
  SLA_COMPLIANCE_RATE: {
    metricCode: 'SLA_COMPLIANCE_RATE',
    displayName: 'SLA Compliance Rate',
    description: 'Percentage of resolved complaints completed prior to SLA deadline',
    unit: '%',
    version: 1,
    formula: '(Count(slaStatus == ON_TIME) / Count(Total Resolved)) * 100',
    enabled: true
  },
  AVG_RESOLUTION_TIME: {
    metricCode: 'AVG_RESOLUTION_TIME',
    displayName: 'Average Resolution Duration',
    description: 'Mean elapsed time in hours from submission to resolution',
    unit: 'Hours',
    version: 1,
    formula: 'Sum(resolutionDurationHours) / Count(Total Resolved)',
    enabled: true
  },
  ESCALATION_RATE: {
    metricCode: 'ESCALATION_RATE',
    displayName: 'Complaint Escalation Rate',
    description: 'Percentage of complaints escalated due to SLA timeout or manual action',
    unit: '%',
    version: 1,
    formula: '(Count(status == ESCALATED) / Count(Total Complaints)) * 100',
    enabled: true
  },
  REOPEN_RATE: {
    metricCode: 'REOPEN_RATE',
    displayName: 'Complaint Reopen Rate',
    description: 'Percentage of resolved complaints reopened by students',
    unit: '%',
    version: 1,
    formula: '(Count(status == REOPENED) / Count(Total Resolved)) * 100',
    enabled: true
  }
};

module.exports = METRICS_CATALOG;
