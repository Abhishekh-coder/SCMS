const DOMAIN_EVENTS = {
  // Complaint Lifecycle Events
  COMPLAINT_CREATED: 'ComplaintCreated',
  COMPLAINT_ASSIGNED: 'ComplaintAssigned',
  COMPLAINT_ESCALATED: 'ComplaintEscalated',
  COMPLAINT_RESOLVED: 'ComplaintResolved',
  COMPLAINT_CLOSED: 'ComplaintClosed',
  COMPLAINT_REOPENED: 'ComplaintReopened',

  // Authentication & Security Events
  USER_LOGGED_IN: 'UserLoggedIn',
  USER_REGISTERED: 'UserRegistered',
  USER_LOGGED_OUT: 'UserLoggedOut',

  // Analytics & Reporting Events
  REPORTING_SNAPSHOT_TRIGGERED: 'ReportingSnapshotTriggered'
};

module.exports = { DOMAIN_EVENTS };
