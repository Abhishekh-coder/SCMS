const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true, default: 'tenant_campus_01' },
  campusId: { type: String, required: true, index: true, default: 'main_campus' },
  ticketNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  departmentId: { type: String, required: true, index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { 
    type: String, 
    enum: ['SUBMITTED', 'CATEGORIZED', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED'], 
    default: 'SUBMITTED',
    index: true 
  },
  submittedBy: { type: String, required: true, index: true },
  assignedTo: { type: String, index: true },
  resolutionDetails: { type: String },
  slaDueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ComplaintModel = mongoose.model('Complaint', complaintSchema);

module.exports = { ComplaintModel, complaintSchema };
