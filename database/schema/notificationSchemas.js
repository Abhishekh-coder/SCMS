const mongoose = require('mongoose');

const baseTenantFields = {
  tenantId: { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId: { type: String, required: true, index: true, default: 'main_campus' },
  isDeleted: { type: Boolean, required: true, default: false, index: true },
  deletedAt: { type: Date, default: null }
};

// 1. Root Notification Entity Schema (With Audited State Machine & Priority)
const notificationSchema = new mongoose.Schema({
  ...baseTenantFields,
  notificationUuid: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    match: [/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/, 'Invalid UUID v4 format']
  },
  userUuid: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['INFO', 'SUCCESS', 'WARNING', 'URGENT'], 
    default: 'INFO',
    index: true 
  },
  priority: {
    type: String,
    required: true,
    enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
    default: 'NORMAL',
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['CREATED', 'QUEUED', 'SENDING', 'DELIVERED', 'READ', 'ARCHIVED'],
    default: 'CREATED',
    index: true
  },
  templateCode: { type: String, default: null },
  templateVersion: { type: Number, default: 1 },
  readAt: { type: Date, default: null },
  actionUrl: { type: String, default: null }
}, { timestamps: true, collection: 'notifications' });

notificationSchema.index({ userUuid: 1, status: 1, createdAt: -1 });

// 2. Versioned Notification Template Schema
const notificationTemplateSchema = new mongoose.Schema({
  templateCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  version: { type: Number, required: true, default: 1 },
  isCurrent: { type: Boolean, required: true, default: true, index: true },
  channel: { type: String, required: true, enum: ['EMAIL', 'IN_APP', 'SMS', 'WHATSAPP', 'PUSH'], default: 'IN_APP' },
  subjectTemplate: { type: String, default: null },
  bodyTemplate: { type: String, required: true },
  variables: [{ type: String }]
}, { timestamps: true, collection: 'notificationTemplates' });

notificationTemplateSchema.index({ templateCode: 1, version: 1 }, { unique: true });

// 3. User Notification Preference Schema (Detailed Channel & Cadence)
const notificationPreferenceSchema = new mongoose.Schema({
  userUuid: { type: String, required: true, unique: true, index: true },
  emailNotifications: { type: Boolean, required: true, default: true },
  inAppNotifications: { type: Boolean, required: true, default: true },
  slaAlerts: { type: Boolean, required: true, default: true },
  cadence: { type: String, enum: ['IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST', 'NEVER'], default: 'IMMEDIATE' }
}, { timestamps: true, collection: 'notificationPreferences' });

// 4. Multi-Channel Delivery Attempt Log Schema (Separated Delivery Concept)
const notificationDeliveryAttemptSchema = new mongoose.Schema({
  attemptUuid: { type: String, required: true, unique: true, index: true },
  notificationUuid: { type: String, required: true, index: true },
  userUuid: { type: String, required: true, index: true },
  channel: { type: String, required: true, enum: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH'], index: true },
  status: { type: String, required: true, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING', index: true },
  retryCount: { type: Number, required: true, default: 0 },
  errorReason: { type: String, default: null },
  deliveredAt: { type: Date, default: null }
}, { timestamps: true, collection: 'notificationDeliveryAttempts' });

module.exports = {
  NotificationSchema: notificationSchema,
  NotificationTemplateSchema: notificationTemplateSchema,
  NotificationPreferenceSchema: notificationPreferenceSchema,
  NotificationDeliveryAttemptSchema: notificationDeliveryAttemptSchema
};
