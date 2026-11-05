const mongoose = require('mongoose');

// 1. Dynamic Feature Flag Schema
const featureFlagSchema = new mongoose.Schema({
  flagCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  isEnabled: { type: Boolean, required: true, default: true, index: true },
  targetTenants: [{ type: String }]
}, { timestamps: true, collection: 'featureFlags' });

// 2. Runtime System Configuration Schema
const systemConfigSchema = new mongoose.Schema({
  configKey: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  configValue: { type: mongoose.Schema.Types.Mixed, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['AUTH', 'SECURITY', 'STORAGE', 'AI', 'NOTIFICATION'], 
    default: 'SECURITY',
    index: true 
  },
  updatedBy: { type: String, default: 'SYSTEM_ADMIN' }
}, { timestamps: true, collection: 'systemConfigs' });

module.exports = {
  FeatureFlagSchema: featureFlagSchema,
  SystemConfigSchema: systemConfigSchema
};
