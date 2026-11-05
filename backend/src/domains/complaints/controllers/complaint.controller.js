const complaintService = require('../complaint.service');
const complaintAggregate = require('../aggregate/ComplaintAggregate');
const mongoose = require('mongoose');
const {
  ComplaintSchema,
  ComplaintEventLedgerSchema,
  ComplaintCommentSchema,
  ComplaintSnapshotSchema
} = require('../../../../../database/schema/complaintSchemas');
const { DivisionSchema, DepartmentSchema } = require('../../../../../database/schema/schemas');
const { AppError, ValidationError } = require('../../../shared/errors/AppError');
const { assertComplaintAccess, DEAN_AUTHORIZED_DEPTS } = require('../../../security/complaintAuthorization');
const crypto = require('crypto');

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
const ComplaintEventLedger = mongoose.models.ComplaintEventLedger || mongoose.model('ComplaintEventLedger', ComplaintEventLedgerSchema);
const ComplaintComment = mongoose.models.ComplaintComment || mongoose.model('ComplaintComment', ComplaintCommentSchema);
const ComplaintSnapshot = mongoose.models.ComplaintSnapshot || mongoose.model('ComplaintSnapshot', ComplaintSnapshotSchema);
const Division = mongoose.models.Division || mongoose.model('Division', DivisionSchema);
const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

class ComplaintController {
  async createComplaint(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    const idempotencyKey = req.headers['idempotency-key'];

    try {
      const primaryRole = req.user.primaryRole || (req.user.roles && req.user.roles[0]) || 'STUDENT';
      const isStudent = primaryRole === 'STUDENT' || req.user.profileType === 'STUDENT';

      if (!isStudent) {
        throw new AppError('Only students are permitted to register complaints.', 403, 'FORBIDDEN');
      }

      const complaint = await complaintService.createComplaint(req.user, req.body, {
        idempotencyKey,
        traceId: requestId
      });

      return res.status(201).json({
        success: true,
        message: 'Complaint submitted and assigned successfully.',
        data: complaint,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getComplaints(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { status, categoryCode, priority, departmentCode, page = 1, limit = 20 } = req.query;

      const query = { tenantId: req.user.tenantId || 'tenant_campus_01' };
      if (status) query.status = status.toUpperCase();
      if (categoryCode) query.categoryCode = categoryCode.toUpperCase();
      if (priority) query.priority = priority.toUpperCase();

      const roles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : ['STUDENT']);
      const primaryRole = req.user.primaryRole || roles[0] || 'STUDENT';
      const userDept = (req.user.departmentCode || req.user.department || '').toUpperCase().trim();

      // Backend Scoping & Data Isolation Rules
      if (primaryRole === 'STUDENT' || roles.includes('STUDENT')) {
        query.createdByUserUuid = req.user.userUuid;
      } else if (primaryRole === 'GUARDIAN' || roles.includes('GUARDIAN')) {
        query.createdByUserUuid = req.user.linkedStudentUuid || 'none';
      } else if (primaryRole === 'CLASS_INCHARGE' || primaryRole === 'TEACHER_GUARDIAN') {
        if (departmentCode && departmentCode.toUpperCase() !== userDept) {
          throw new AppError(`Access forbidden: You cannot view complaints from ${departmentCode} department.`, 403, 'FORBIDDEN');
        }
        query.departmentCode = userDept;
        query.$or = [
          { assignedToUserUuid: req.user.userUuid },
          { assignedUserUuids: req.user.userUuid }
        ];
      } else if (primaryRole === 'HOD') {
        if (departmentCode && departmentCode.toUpperCase() !== userDept) {
          throw new AppError(`Access forbidden: HOD cannot view complaints from ${departmentCode} department.`, 403, 'FORBIDDEN');
        }
        query.departmentCode = userDept;
      } else if (primaryRole === 'CAMPUS_SERVICES_HEAD' || roles.includes('MAINTENANCE_STAFF') || roles.includes('TECHNICIAN')) {
        query.$or = [
          { assignedToUserUuid: req.user.userUuid },
          { assignedUserUuids: req.user.userUuid },
          { departmentCode: 'CAMPUS_SERVICES' }
        ];
      } else if (primaryRole === 'DEAN') {
        if (departmentCode) {
          if (!DEAN_AUTHORIZED_DEPTS.includes(departmentCode.toUpperCase())) {
            throw new AppError(`Access forbidden: Department ${departmentCode} is outside Dean authorized academic scope.`, 403, 'FORBIDDEN');
          }
          query.departmentCode = departmentCode.toUpperCase();
        } else {
          query.departmentCode = { $in: DEAN_AUTHORIZED_DEPTS };
        }
      } else if (['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'].includes(primaryRole)) {
        if (departmentCode) query.departmentCode = departmentCode.toUpperCase();
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const snapshots = await ComplaintSnapshot.find(query)
        .sort({ lastUpdated: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await ComplaintSnapshot.countDocuments(query);

      return res.status(200).json({
        success: true,
        message: 'Complaint dashboard snapshots retrieved.',
        data: snapshots,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatsSummary(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const tenantId = req.user.tenantId || 'tenant_campus_01';
      const userUuid = req.user.userUuid;
      const roles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : ['STUDENT']);
      const primaryRole = req.user.primaryRole || roles[0] || 'STUDENT';

      let totalReceived = 0;
      let inProgress = 0;
      let forwarded = 0;
      let escalated = 0;
      let resolved = 0;

      if (primaryRole === 'STUDENT') {
        const studentQuery = { tenantId, createdByUserUuid: userUuid, isDeleted: false };
        [inProgress, resolved, escalated] = await Promise.all([
          Complaint.countDocuments({ ...studentQuery, status: { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'] } }),
          Complaint.countDocuments({ ...studentQuery, status: { $in: ['RESOLVED', 'CLOSED'] } }),
          Complaint.countDocuments({ ...studentQuery, status: 'ESCALATED' })
        ]);
        totalReceived = inProgress + resolved + escalated;
      } else if (primaryRole === 'CLASS_INCHARGE') {
        const historicalQuery = { tenantId, isDeleted: false, $or: [{ assignedToUserUuid: userUuid }, { assignedUserUuids: userUuid }] };
        [totalReceived, inProgress, forwarded, resolved] = await Promise.all([
          Complaint.countDocuments(historicalQuery),
          Complaint.countDocuments({ tenantId, assignedToUserUuid: userUuid, status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }, isDeleted: false }),
          Complaint.countDocuments({ tenantId, forwardedFromUserUuid: userUuid, status: 'FORWARDED', isDeleted: false }),
          Complaint.countDocuments({ tenantId, resolvedByUserUuid: userUuid, status: { $in: ['RESOLVED', 'CLOSED'] }, isDeleted: false })
        ]);
      } else if (primaryRole === 'TEACHER_GUARDIAN') {
        const historicalQuery = { tenantId, isDeleted: false, $or: [{ assignedToUserUuid: userUuid }, { assignedUserUuids: userUuid }] };
        [totalReceived, inProgress, escalated, resolved] = await Promise.all([
          Complaint.countDocuments(historicalQuery),
          Complaint.countDocuments({ tenantId, assignedToUserUuid: userUuid, status: { $in: ['FORWARDED', 'IN_PROGRESS'] }, isDeleted: false }),
          Complaint.countDocuments({ tenantId, assignedUserUuids: userUuid, status: 'ESCALATED', isDeleted: false }),
          Complaint.countDocuments({ tenantId, resolvedByUserUuid: userUuid, status: { $in: ['RESOLVED', 'CLOSED'] }, isDeleted: false })
        ]);
      } else if (primaryRole === 'HOD') {
        const deptCode = req.user.departmentCode || req.user.department || 'IT';
        const deptQuery = { tenantId, departmentCode: deptCode, isDeleted: false };
        [totalReceived, inProgress, escalated, resolved] = await Promise.all([
          Complaint.countDocuments(deptQuery),
          Complaint.countDocuments({ ...deptQuery, status: { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'] } }),
          Complaint.countDocuments({ tenantId, assignedToUserUuid: userUuid, status: 'ESCALATED', isDeleted: false }),
          Complaint.countDocuments({ ...deptQuery, status: { $in: ['RESOLVED', 'CLOSED'] } })
        ]);
        forwarded = 0;
      } else if (primaryRole === 'DEAN') {
        const deanAuthorizedDepts = ['IT', 'CE', 'EXTC', 'ACADEMIC'];
        const entityQuery = { tenantId, departmentCode: { $in: deanAuthorizedDepts }, isDeleted: false };
        [totalReceived, inProgress, escalated, resolved] = await Promise.all([
          Complaint.countDocuments(entityQuery),
          Complaint.countDocuments({ ...entityQuery, status: { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'] } }),
          Complaint.countDocuments({ tenantId, assignedToUserUuid: userUuid, status: 'ESCALATED', isDeleted: false }),
          Complaint.countDocuments({ ...entityQuery, status: { $in: ['RESOLVED', 'CLOSED'] } })
        ]);
        forwarded = 0;
      } else if (['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'].includes(primaryRole)) {
        const instQuery = { tenantId, isDeleted: false };
        [totalReceived, inProgress, escalated, resolved] = await Promise.all([
          Complaint.countDocuments(instQuery),
          Complaint.countDocuments({ ...instQuery, status: { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'] } }),
          Complaint.countDocuments({ tenantId, assignedToUserUuid: userUuid, status: 'ESCALATED', isDeleted: false }),
          Complaint.countDocuments({ ...instQuery, status: { $in: ['RESOLVED', 'CLOSED'] } })
        ]);
        forwarded = 0;
      } else {
        const staffQuery = { tenantId, isDeleted: false };
        if (req.user.departmentCode) {
          staffQuery.departmentCode = req.user.departmentCode;
        }
        [totalReceived, inProgress, forwarded, escalated, resolved] = await Promise.all([
          Complaint.countDocuments(staffQuery),
          Complaint.countDocuments({ ...staffQuery, status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } }),
          Complaint.countDocuments({ ...staffQuery, status: 'FORWARDED' }),
          Complaint.countDocuments({ ...staffQuery, status: 'ESCALATED' }),
          Complaint.countDocuments({ ...staffQuery, status: { $in: ['RESOLVED', 'CLOSED'] } })
        ]);
      }

      // ─── Authoritative Division Aggregation for HOD / Department Command Center ───
      let divisionsData = [];
      let departmentsData = [];
      let needingAttention = null;

      if (primaryRole === 'HOD' || (req.user.departmentCode && !['DEAN', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'].includes(primaryRole))) {
        const deptCode = req.user.departmentCode || req.user.department || 'IT';
        
        // Dynamically discover configured divisions for this department from master data
        const masterDivisions = await Division.find({
          tenantId,
          department: deptCode,
          isActive: true
        }).lean();

        const divisionMap = new Map();

        if (masterDivisions && masterDivisions.length > 0) {
          masterDivisions.forEach(d => {
            const cleanDiv = d.division || d.scopeId.replace(/^2024-/, '').replace(new RegExp(`^${deptCode}-`), '');
            const divKey = `${deptCode}-${cleanDiv}`;
            divisionMap.set(divKey, {
              divisionCode: divKey,
              fullCode: d.scopeId,
              label: `${deptCode} Division ${cleanDiv}`,
              total: 0,
              open: 0,
              escalated: 0,
              resolved: 0
            });
          });
        } else {
          // Fallback defaults
          ['A', 'B'].forEach(divLetter => {
            const divKey = `${deptCode}-${divLetter}`;
            divisionMap.set(divKey, {
              divisionCode: divKey,
              fullCode: `2024-${deptCode}-${divLetter}`,
              label: `${deptCode} Division ${divLetter}`,
              total: 0,
              open: 0,
              escalated: 0,
              resolved: 0
            });
          });
        }

        // Fetch all complaints in this department to build authoritative division counters
        const allDeptComplaints = await Complaint.find({
          tenantId,
          departmentCode: deptCode,
          isDeleted: false
        }).select('divisionCode status priority').lean();

        allDeptComplaints.forEach(c => {
          let rawDiv = (c.divisionCode || `${deptCode}-A`).toUpperCase().trim();
          let normKey = rawDiv.replace(/^2024-/, '');
          if (!normKey.includes('-')) {
            normKey = `${deptCode}-${normKey}`;
          }

          if (!divisionMap.has(normKey)) {
            divisionMap.set(normKey, {
              divisionCode: normKey,
              fullCode: rawDiv,
              label: `${normKey} Division`,
              total: 0,
              open: 0,
              escalated: 0,
              resolved: 0
            });
          }

          const divObj = divisionMap.get(normKey);
          divObj.total += 1;

          if (['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'].includes(c.status)) {
            divObj.open += 1;
          }
          if (c.status === 'ESCALATED') {
            divObj.escalated += 1;
          }
          if (['RESOLVED', 'CLOSED'].includes(c.status)) {
            divObj.resolved += 1;
          }
        });

        const deptTotalCount = Array.from(divisionMap.values()).reduce((sum, d) => sum + d.total, 0);

        divisionsData = Array.from(divisionMap.values()).map(div => {
          let workloadStatus = 'NO_OPEN_CASES';
          let workloadLabel = 'No Open Cases';

          if (div.escalated > 0) {
            workloadStatus = 'NEEDS_REVIEW';
            workloadLabel = 'Needs Review';
          } else if (div.open > 0) {
            workloadStatus = 'OPEN_CASES';
            workloadLabel = div.open === 1 ? '1 Open' : `${div.open} Open`;
          }

          const percentage = deptTotalCount > 0 ? Math.round((div.total / deptTotalCount) * 100) : 0;

          return {
            ...div,
            healthStatus: workloadStatus,
            healthLabel: workloadLabel,
            workloadStatus,
            workloadLabel,
            distribution: {
              count: div.total,
              denominator: deptTotalCount,
              percentage
            }
          };
        });

        // Determine Division Needing Attention (highest risk score)
        const sortedByRisk = [...divisionsData].sort((a, b) => {
          const riskA = (a.escalated * 5) + (a.open * 2) + a.total;
          const riskB = (b.escalated * 5) + (b.open * 2) + b.total;
          return riskB - riskA;
        });

        if (sortedByRisk.length > 0 && (sortedByRisk[0].open > 0 || sortedByRisk[0].escalated > 0)) {
          const worst = sortedByRisk[0];
          needingAttention = {
            divisionCode: worst.divisionCode,
            fullCode: worst.fullCode,
            label: worst.label,
            open: worst.open,
            escalated: worst.escalated,
            total: worst.total,
            reason: `Highest active complaint load in ${deptCode} Department`
          };
        } else if (sortedByRisk.length > 0) {
          needingAttention = {
            divisionCode: sortedByRisk[0].divisionCode,
            fullCode: sortedByRisk[0].fullCode,
            label: sortedByRisk[0].label,
            open: 0,
            escalated: 0,
            total: sortedByRisk[0].total,
            reason: `All ${deptCode} divisions operating within healthy parameters`
          };
        }
      } else if (primaryRole === 'DEAN') {
        // ─── Authoritative Department Aggregation for Dean Command Center ───
        const deanDepts = [
          { departmentCode: 'IT', label: 'Information Technology' },
          { departmentCode: 'CE', label: 'Computer Engineering' },
          { departmentCode: 'EXTC', label: 'Electronics & Telecommunication' }
        ];

        const allEntityComplaints = await Complaint.find({
          tenantId,
          departmentCode: { $in: ['IT', 'CE', 'EXTC', 'ACADEMIC'] },
          isDeleted: false
        }).select('departmentCode status priority').lean();

        const deptMap = new Map();
        deanDepts.forEach(d => {
          deptMap.set(d.departmentCode, {
            departmentCode: d.departmentCode,
            label: d.label,
            total: 0,
            open: 0,
            escalated: 0,
            resolved: 0
          });
        });

        allEntityComplaints.forEach(c => {
          const dept = (c.departmentCode || 'IT').toUpperCase().trim();
          if (!deptMap.has(dept)) {
            deptMap.set(dept, {
              departmentCode: dept,
              label: dept,
              total: 0,
              open: 0,
              escalated: 0,
              resolved: 0
            });
          }
          const dObj = deptMap.get(dept);
          dObj.total += 1;
          if (['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'].includes(c.status)) {
            dObj.open += 1;
          }
          if (c.status === 'ESCALATED') {
            dObj.escalated += 1;
          }
          if (['RESOLVED', 'CLOSED'].includes(c.status)) {
            dObj.resolved += 1;
          }
        });

        departmentsData = Array.from(deptMap.values()).map(dept => {
          let healthStatus = 'HEALTHY';
          let healthLabel = 'Healthy';

          if (dept.escalated >= 2 || dept.open >= 8) {
            healthStatus = 'CRITICAL';
            healthLabel = 'Critical';
          } else if (dept.escalated > 0 || dept.open > 0) {
            healthStatus = 'ATTENTION';
            healthLabel = 'Attention';
          }

          return {
            ...dept,
            healthStatus,
            healthLabel
          };
        });

        const sortedByRisk = [...departmentsData].sort((a, b) => {
          const riskA = (a.escalated * 5) + (a.open * 2) + a.total;
          const riskB = (b.escalated * 5) + (b.open * 2) + b.total;
          return riskB - riskA;
        });

        if (sortedByRisk.length > 0 && (sortedByRisk[0].open > 0 || sortedByRisk[0].escalated > 0)) {
          const worst = sortedByRisk[0];
          needingAttention = {
            departmentCode: worst.departmentCode,
            label: worst.label,
            open: worst.open,
            escalated: worst.escalated,
            total: worst.total,
            reason: `Highest active complaint load in ${worst.label}`
          };
        } else if (sortedByRisk.length > 0) {
          needingAttention = {
            departmentCode: sortedByRisk[0].departmentCode,
            label: sortedByRisk[0].label,
            open: 0,
            escalated: 0,
            total: sortedByRisk[0].total,
            reason: 'All faculty departments operating within healthy parameters'
          };
        }
      } else if (['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'].includes(primaryRole)) {
        // ─── Authoritative Department Aggregation for Principal Institution Command Center ───
        const instDepts = [
          { departmentCode: 'IT', label: 'Information Technology' },
          { departmentCode: 'CE', label: 'Computer Engineering' },
          { departmentCode: 'EXTC', label: 'Electronics & Telecommunication' },
          { departmentCode: 'ACADEMIC', label: 'Academic Affairs' },
          { departmentCode: 'CAMPUS_SERVICES', label: 'Campus Services' }
        ];

        const allInstComplaints = await Complaint.find({
          tenantId,
          isDeleted: false
        }).select('departmentCode status priority').lean();

        const deptMap = new Map();
        instDepts.forEach(d => {
          deptMap.set(d.departmentCode, {
            departmentCode: d.departmentCode,
            label: d.label,
            total: 0,
            open: 0,
            escalated: 0,
            resolved: 0
          });
        });

        allInstComplaints.forEach(c => {
          const dept = (c.departmentCode || 'IT').toUpperCase().trim();
          if (!deptMap.has(dept)) {
            deptMap.set(dept, {
              departmentCode: dept,
              label: dept,
              total: 0,
              open: 0,
              escalated: 0,
              resolved: 0
            });
          }
          const dObj = deptMap.get(dept);
          dObj.total += 1;
          if (['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'].includes(c.status)) {
            dObj.open += 1;
          }
          if (c.status === 'ESCALATED') {
            dObj.escalated += 1;
          }
          if (['RESOLVED', 'CLOSED'].includes(c.status)) {
            dObj.resolved += 1;
          }
        });

        departmentsData = Array.from(deptMap.values()).map(dept => {
          let healthStatus = 'HEALTHY';
          let healthLabel = 'Healthy';

          if (dept.escalated >= 2 || dept.open >= 8) {
            healthStatus = 'CRITICAL';
            healthLabel = 'Critical';
          } else if (dept.escalated > 0 || dept.open > 0) {
            healthStatus = 'ATTENTION';
            healthLabel = 'Attention';
          }

          return {
            ...dept,
            healthStatus,
            healthLabel
          };
        });

        const sortedByRisk = [...departmentsData].sort((a, b) => {
          const riskA = (a.escalated * 5) + (a.open * 2) + a.total;
          const riskB = (b.escalated * 5) + (b.open * 2) + b.total;
          return riskB - riskA;
        });

        if (sortedByRisk.length > 0 && (sortedByRisk[0].open > 0 || sortedByRisk[0].escalated > 0)) {
          const worst = sortedByRisk[0];
          needingAttention = {
            departmentCode: worst.departmentCode,
            label: worst.label,
            open: worst.open,
            escalated: worst.escalated,
            total: worst.total,
            reason: `Highest active complaint load in ${worst.label}`
          };
        } else if (sortedByRisk.length > 0) {
          needingAttention = {
            departmentCode: sortedByRisk[0].departmentCode,
            label: sortedByRisk[0].label,
            open: 0,
            escalated: 0,
            total: sortedByRisk[0].total,
            reason: 'All institution departments operating within healthy parameters'
          };
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Role-scoped complaint statistics retrieved.',
        data: {
          role: primaryRole,
          departmentCode: req.user.departmentCode || null,
          divisionCode: req.user.divisionCode || null,
          stats: {
            total: Number(totalReceived || 0),
            totalReceived: Number(totalReceived || 0),
            open: Number(inProgress || 0),
            inProgress: Number(inProgress || 0),
            forwarded: Number(forwarded || 0),
            escalated: Number(escalated || 0),
            resolved: Number(resolved || 0),
            pending: Number(inProgress || 0)
          },
          divisions: divisionsData,
          departments: departmentsData,
          needingAttention
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getDivisionComplaints(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const roles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : []);
      const isAuthorized = roles.some(r => ['CLASS_INCHARGE', 'TEACHER_GUARDIAN', 'HOD', 'FACULTY', 'DEAN', 'PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(r));
      if (!isAuthorized) {
        throw new AppError('Access forbidden: Insufficient privileges to view division complaints.', 403, 'FORBIDDEN');
      }

      const tenantId = req.user.tenantId || 'tenant_campus_01';
      const deptCode = req.user.departmentCode || req.user.department || 'IT';
      const divCode = req.user.divisionCode || req.user.division || '2024-IT-A';

      if (!deptCode || !divCode) {
        throw new AppError('Division scope missing on user profile.', 403, 'FORBIDDEN');
      }

      const snapshots = await ComplaintSnapshot.find({
        tenantId,
        domainType: { $ne: 'OPERATIONAL' },
        departmentCode: deptCode,
        divisionCode: divCode
      }).sort({ lastUpdated: -1 });

      return res.status(200).json({
        success: true,
        message: `Division ${divCode} read-only complaints retrieved.`,
        data: snapshots,
        meta: {
          total: snapshots.length,
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentComplaints(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const roles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : []);
      const primaryRole = req.user.primaryRole || roles[0] || '';
      const isAuthorized = roles.some(r => ['HOD', 'FACULTY', 'CLASS_INCHARGE', 'TEACHER_GUARDIAN', 'DEAN', 'PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(r));
      if (!isAuthorized) {
        throw new AppError('Access forbidden: Insufficient privileges to view department complaints.', 403, 'FORBIDDEN');
      }

      const tenantId = req.user.tenantId || 'tenant_campus_01';
      let deptCode = req.user.departmentCode || req.user.department || 'IT';

      const requestedDept = req.query.departmentCode;
      if (requestedDept) {
        const reqUpper = requestedDept.toUpperCase().trim();
        if (['PRINCIPAL', 'SUPER_ADMIN'].includes(primaryRole) || roles.includes('SUPER_ADMIN')) {
          deptCode = reqUpper;
        } else if (primaryRole === 'DEAN' || roles.includes('DEAN')) {
          if (!DEAN_AUTHORIZED_DEPTS.includes(reqUpper)) {
            throw new AppError(`Access forbidden: ${requestedDept} is outside authorized Dean academic departments.`, 403, 'FORBIDDEN');
          }
          deptCode = reqUpper;
        } else {
          if (reqUpper !== deptCode.toUpperCase().trim()) {
            throw new AppError(`Access forbidden: You cannot view ${requestedDept} department records.`, 403, 'FORBIDDEN');
          }
        }
      }

      if (!deptCode) {
        throw new AppError('Department scope missing on user profile.', 403, 'FORBIDDEN');
      }

      const { divisionCode, status, priority, search } = req.query;
      const filter = {
        tenantId,
        domainType: { $ne: 'OPERATIONAL' },
        departmentCode: deptCode
      };

      if (divisionCode && divisionCode !== 'ALL') {
        const cleanDiv = divisionCode.replace(/^2024-/, '').trim();
        filter.divisionCode = { $regex: new RegExp(cleanDiv, 'i') };
      }

      if (status && status !== 'ALL') {
        const st = status.toUpperCase().trim();
        if (st === 'OPEN') {
          filter.status = { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'] };
        } else {
          filter.status = st;
        }
      }

      if (priority && priority !== 'ALL') {
        filter.priority = priority.toUpperCase().trim();
      }

      if (search && search.trim()) {
        const term = search.trim();
        filter.$or = [
          { complaintCode: { $regex: new RegExp(term, 'i') } },
          { title: { $regex: new RegExp(term, 'i') } },
          { description: { $regex: new RegExp(term, 'i') } }
        ];
      }

      const snapshots = await ComplaintSnapshot.find(filter).sort({ lastUpdated: -1 });

      return res.status(200).json({
        success: true,
        message: `Department ${deptCode} read-only complaints retrieved.`,
        data: snapshots,
        meta: {
          total: snapshots.length,
          departmentCode: deptCode,
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentFaculty(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const roles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : []);
      const isAuthorized = roles.some(r => ['HOD', 'FACULTY', 'CLASS_INCHARGE', 'TEACHER_GUARDIAN', 'DEAN', 'PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(r));
      if (!isAuthorized) {
        throw new AppError('Access forbidden: Insufficient privileges to view department faculty directory.', 403, 'FORBIDDEN');
      }

      const tenantId = req.user.tenantId || 'tenant_campus_01';
      const deptCode = req.user.departmentCode || req.user.department || 'IT';

      if (!deptCode) {
        throw new AppError('Department scope missing on user profile.', 403, 'FORBIDDEN');
      }

      const { UserSchema, OrganizationalAssignmentSchema } = require('../../../../../database/schema/schemas');
      const User = mongoose.models.User || mongoose.model('User', UserSchema);
      const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment', OrganizationalAssignmentSchema);

      const divisions = await Division.find({
        tenantId,
        department: deptCode,
        isActive: true
      }).lean();

      const assignments = await OrganizationalAssignment.find({
        tenantId,
        $or: [
          { scopeType: 'DIVISION', scopeId: { $regex: new RegExp(`^2024-${deptCode}-|${deptCode}-`, 'i') } },
          { scopeType: 'DEPARTMENT', scopeId: deptCode }
        ],
        isActive: true
      }).lean();

      const userIds = assignments.map(a => a.assigneeUserId).filter(Boolean);
      const users = await User.find({ _id: { $in: userIds } }).select('fullName email loginId userUuid').lean();
      const userMap = new Map(users.map(u => [String(u._id), u]));

      const divisionMap = new Map();

      divisions.forEach(d => {
        const cleanDiv = d.division || d.scopeId.replace(/^2024-/, '').replace(new RegExp(`^${deptCode}-`), '');
        const divKey = `${deptCode}-${cleanDiv}`;
        divisionMap.set(divKey, {
          divisionCode: divKey,
          fullCode: d.scopeId,
          label: `${deptCode} Division ${cleanDiv}`,
          faculty: []
        });
      });

      assignments.forEach(a => {
        const userObj = userMap.get(String(a.assigneeUserId)) || {};
        const roleLabel = a.assignmentType === 'CLASS_INCHARGE'
          ? 'Class Incharge'
          : a.assignmentType === 'TEACHER_GUARDIAN'
          ? 'Teacher Guardian'
          : a.assignmentType === 'HOD'
          ? 'Head of Department'
          : a.assignmentType?.replace(/_/g, ' ');

        let rawDiv = (a.scopeId || `${deptCode}-A`).replace(/^2024-/, '');
        if (!rawDiv.includes('-')) rawDiv = `${deptCode}-${rawDiv}`;

        if (!divisionMap.has(rawDiv)) {
          divisionMap.set(rawDiv, {
            divisionCode: rawDiv,
            fullCode: a.scopeId,
            label: `${rawDiv} Division`,
            faculty: []
          });
        }

        const divEntry = divisionMap.get(rawDiv);
        divEntry.faculty.push({
          assignmentUuid: a._id,
          name: userObj.fullName || a.title || 'Faculty Member',
          email: userObj.email || `${userObj.loginId?.toLowerCase() || 'faculty'}@college.edu`,
          loginId: userObj.loginId || '',
          assignmentType: a.assignmentType,
          roleLabel
        });
      });

      return res.status(200).json({
        success: true,
        message: `Department ${deptCode} faculty and staff directory retrieved.`,
        data: Array.from(divisionMap.values()),
        meta: {
          totalDivisions: divisionMap.size,
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeanScopeComplaints(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const roles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : []);
      const isAuthorized = roles.some(r => ['DEAN', 'PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(r));
      if (!isAuthorized) {
        throw new AppError('Access forbidden: Insufficient privileges to view dean-scoped complaints.', 403, 'FORBIDDEN');
      }

      const tenantId = req.user.tenantId || 'tenant_campus_01';
      const primaryRole = req.user.primaryRole || roles[0] || 'DEAN';

      // Authorized departments for Dean of Academic / Engineering Entity
      const authorizedDepartments = ['IT', 'CE', 'EXTC', 'ACADEMIC'];

      const { departmentCode, status, priority, divisionCode, search } = req.query;
      const filter = {
        tenantId,
        isDeleted: false
      };

      // Strict scope enforcement: if client passes departmentCode, it MUST be in authorizedDepartments
      if (departmentCode && departmentCode !== 'ALL') {
        const targetDept = departmentCode.toUpperCase().trim();
        if (!authorizedDepartments.includes(targetDept)) {
          throw new AppError(`Department '${departmentCode}' is outside authorized entity scope for Dean.`, 403, 'FORBIDDEN');
        }
        filter.departmentCode = targetDept;
      } else {
        filter.departmentCode = { $in: authorizedDepartments };
      }

      if (divisionCode && divisionCode !== 'ALL') {
        const cleanDiv = divisionCode.replace(/^2024-/, '').trim();
        filter.divisionCode = { $regex: new RegExp(cleanDiv, 'i') };
      }

      if (status && status !== 'ALL') {
        const st = status.toUpperCase().trim();
        if (st === 'OPEN') {
          filter.status = { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'] };
        } else {
          filter.status = st;
        }
      }

      if (priority && priority !== 'ALL') {
        filter.priority = priority.toUpperCase().trim();
      }

      if (search && search.trim()) {
        const term = search.trim();
        filter.$or = [
          { complaintCode: { $regex: new RegExp(term, 'i') } },
          { title: { $regex: new RegExp(term, 'i') } },
          { description: { $regex: new RegExp(term, 'i') } }
        ];
      }

      const snapshots = await ComplaintSnapshot.find(filter).sort({ lastUpdated: -1 });

      return res.status(200).json({
        success: true,
        message: 'Dean organizational entity complaints retrieved.',
        data: snapshots,
        meta: {
          total: snapshots.length,
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getInstitutionComplaints(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const roles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : []);
      const isAuthorized = roles.some(r => ['PRINCIPAL', 'SUPER_ADMIN', 'DEAN', 'ADMIN'].includes(r));
      if (!isAuthorized) {
        throw new AppError('Access forbidden: Insufficient administrative privileges to view institution-wide complaints.', 403, 'FORBIDDEN');
      }

      const tenantId = req.user.tenantId || 'tenant_campus_01';
      const { departmentCode, divisionCode, status, priority, search } = req.query;

      const filter = {
        tenantId,
        isDeleted: false
      };

      if (departmentCode && departmentCode !== 'ALL') {
        filter.departmentCode = departmentCode.toUpperCase().trim();
      }

      if (divisionCode && divisionCode !== 'ALL') {
        const cleanDiv = divisionCode.replace(/^2024-/, '').trim();
        filter.divisionCode = { $regex: new RegExp(cleanDiv, 'i') };
      }

      if (status && status !== 'ALL') {
        const st = status.toUpperCase().trim();
        if (st === 'OPEN') {
          filter.status = { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'CATEGORIZED', 'REOPENED'] };
        } else {
          filter.status = st;
        }
      }

      if (priority && priority !== 'ALL') {
        filter.priority = priority.toUpperCase().trim();
      }

      if (search && search.trim()) {
        const term = search.trim();
        filter.$or = [
          { complaintCode: { $regex: new RegExp(term, 'i') } },
          { title: { $regex: new RegExp(term, 'i') } },
          { description: { $regex: new RegExp(term, 'i') } }
        ];
      }

      const snapshots = await ComplaintSnapshot.find(filter).sort({ lastUpdated: -1 });

      return res.status(200).json({
        success: true,
        message: 'Institution-wide complaints retrieved.',
        data: snapshots,
        meta: {
          total: snapshots.length,
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyAssignedComplaints(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const tenantId = req.user.tenantId || 'tenant_campus_01';
      const userUuid = req.user.userUuid;
      const roles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : ['STUDENT']);
      const primaryRole = req.user.primaryRole || roles[0] || 'STUDENT';

      const query = {
        tenantId,
        assignedToUserUuid: userUuid
      };

      if (primaryRole === 'TEACHER_GUARDIAN') {
        query.status = { $in: ['FORWARDED', 'ESCALATED'] };
      } else if (['HOD', 'DEAN', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'].includes(primaryRole)) {
        query.status = 'ESCALATED';
      } else {
        query.status = { $in: ['ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'ESCALATED'] };
      }

      const snapshots = await ComplaintSnapshot.find(query).sort({ lastUpdated: -1 });

      return res.status(200).json({
        success: true,
        message: 'Currently assigned actionable complaints retrieved.',
        data: snapshots,
        meta: {
          total: snapshots.length,
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getComplaintByUuid(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;

      const complaint = await Complaint.findOne({ complaintUuid, isDeleted: false });
      if (!complaint) {
        throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
      }

      // Role, ownership, and department isolation check
      const userRoles = [
        ...(Array.isArray(req.user?.roles) ? req.user.roles : []),
        req.user?.primaryRole,
        req.user?.role,
        ...(Array.isArray(req.tokenPayload?.roles) ? req.tokenPayload.roles : [])
      ].filter(Boolean).map(r => String(r).toUpperCase().trim());

      assertComplaintAccess(req.user, complaint, 'READ');

      // Query ComplaintEventLedger (Immutable Timeline Event Ledger)
      const eventLedger = await ComplaintEventLedger.find({ complaintId: complaint._id }).sort({ timestamp: 1 });
      
      // Filter Comments (Students see PUBLIC comments only; Staff/HOD see PUBLIC + INTERNAL)
      const commentQuery = { complaintId: complaint._id };
      const isStaffOrAdmin = userRoles.some(r => ['FACULTY', 'HOD', 'DEAN', 'PRINCIPAL', 'SYSTEM_ADMIN', 'ADMIN', 'CAMPUS_SERVICES_HEAD', 'CLASS_INCHARGE', 'TEACHER_GUARDIAN'].includes(r));
      if (!isStaffOrAdmin) {
        commentQuery.commentType = 'PUBLIC';
      }

      const comments = await ComplaintComment.find(commentQuery).sort({ timestamp: 1 });

      return res.status(200).json({
        success: true,
        message: 'Complaint aggregate details, event ledger, and comments retrieved.',
        data: {
          complaint,
          eventLedger,
          comments
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async executeAction(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;
      const action = req.body?.action || req.body?.actionVerb;
      const { note, version } = req.body || {};

      if (!action) {
        throw new ValidationError('Action target state is required.', 'VAL_001');
      }

      // Strict Backend Action Authorization: Verify complaint exists, is active (not terminal), and is assigned to user
      const existingComplaint = await Complaint.findOne({ complaintUuid, isDeleted: false });
      if (!existingComplaint) {
        throw new AppError(`Complaint '${complaintUuid}' not found.`, 404, 'NOT_FOUND');
      }

      // Department & scope validation
      assertComplaintAccess(req.user, existingComplaint, 'WRITE');

      // Map frontend action verbs (ACTION_*) to workflow state names
      const ACTION_TO_STATE = {
        ACTION_SUBMIT: 'SUBMITTED',
        SUBMIT: 'SUBMITTED',
        ACTION_CATEGORIZE: 'CATEGORIZED',
        CATEGORIZE: 'CATEGORIZED',
        ACTION_ASSIGN: 'ASSIGNED',
        ASSIGN: 'ASSIGNED',
        ACTION_START: 'IN_PROGRESS',
        START: 'IN_PROGRESS',
        ACTION_FORWARD: 'FORWARDED',
        FORWARD: 'FORWARDED',
        ACTION_ESCALATE: 'ESCALATED',
        ESCALATE: 'ESCALATED',
        ACTION_RECONSIDER: 'ESCALATED',
        RECONSIDER: 'ESCALATED',
        ACTION_APPEAL: 'ESCALATED',
        APPEAL: 'ESCALATED',
        ACTION_RESOLVE: 'RESOLVED',
        RESOLVE: 'RESOLVED',
        ACTION_CLOSE: 'CLOSED',
        CLOSE: 'CLOSED',
        ACTION_REOPEN: 'REOPENED',
        REOPEN: 'REOPENED',
        ACTION_CANCEL: 'CANCELLED',
        CANCEL: 'CANCELLED',
        ACTION_REJECT: 'REJECTED',
        REJECT: 'REJECTED',
        ACTION_RETURN_FOR_CORRECTION: 'RETURNED_FOR_CORRECTION',
        RETURN_FOR_CORRECTION: 'RETURNED_FOR_CORRECTION',
        ACTION_RESUBMIT: 'SUBMITTED',
        RESUBMIT: 'SUBMITTED'
      };

      const rawAction = action.toUpperCase().trim();
      const targetState = ACTION_TO_STATE[rawAction] || rawAction;

      // ── Authorization & State Rules ──
      if (['CLOSED', 'CANCELLED'].includes(existingComplaint.status)) {
        throw new AppError(`Complaint '${complaintUuid}' is in a final closed state and requires no further action.`, 409, 'COMPLAINT_FINAL_STATE');
      }

      if (existingComplaint.status === 'RESOLVED') {
        // From RESOLVED state: Only the student creator can Accept/Close or Request Reconsideration
        if (existingComplaint.createdByUserUuid !== req.user.userUuid) {
          throw new AppError('Only the student who submitted this complaint can accept the resolution or request reconsideration.', 403, 'FORBIDDEN');
        }
        if (!['CLOSED', 'ESCALATED'].includes(targetState)) {
          throw new AppError(`Invalid action '${rawAction}' on resolved complaint. You can only accept/close or request reconsideration.`, 400, 'INVALID_ACTION');
        }
      } else if (existingComplaint.status === 'RETURNED_FOR_CORRECTION') {
        // From RETURNED_FOR_CORRECTION: Only student creator can resubmit or cancel
        if (existingComplaint.createdByUserUuid !== req.user.userUuid) {
          throw new AppError('Only the student who submitted this complaint can resubmit after correction.', 403, 'FORBIDDEN');
        }
        if (!['SUBMITTED', 'CANCELLED'].includes(targetState)) {
          throw new AppError(`Invalid action '${rawAction}' on complaint returned for correction.`, 400, 'INVALID_ACTION');
        }
      } else {
        // From Active Handler states: Only current assigned handler or supervisory leadership can execute actions
        const userRoles = req.user.roles || (req.user.primaryRole ? [req.user.primaryRole] : []);
        const isPrincipal = userRoles.includes('PRINCIPAL') || req.user.primaryRole === 'PRINCIPAL';
        const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
        const isPrivileged = isPrincipal || isSuperAdmin || (userRoles.includes('ADMIN') && existingComplaint.departmentCode === 'CAMPUS_SERVICES');

        if (existingComplaint.assignedToUserUuid && existingComplaint.assignedToUserUuid !== req.user.userUuid && !isPrivileged) {
          throw new AppError('Unauthorized: You are not currently assigned to execute actions on this complaint.', 403, 'FORBIDDEN');
        }
      }

      if (['FORWARDED', 'ESCALATED', 'RESOLVED', 'REJECTED', 'RETURNED_FOR_CORRECTION'].includes(targetState) && (!note || !note.trim())) {
        throw new ValidationError('An action note / justification is required before performing this state transition.', 'VAL_NOTE_REQUIRED');
      }

      const updatedComplaint = await complaintAggregate.executeTransitionWithConcurrency(
        req.user,
        complaintUuid,
        targetState,
        note,
        version
      );

      return res.status(200).json({
        success: true,
        message: `Complaint state updated to '${updatedComplaint.status}'.`,
        data: updatedComplaint,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async addComment(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;
      const { message, commentType } = req.body || {};

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new ValidationError('Comment message is required.', 'VAL_001');
      }

      const roles = req.tokenPayload ? req.tokenPayload.roles : ['STUDENT'];
      let targetType = 'PUBLIC';
      if (commentType && (roles.includes('FACULTY') || roles.includes('HOD') || roles.includes('SYSTEM_ADMIN'))) {
        targetType = commentType.toUpperCase().trim();
      }

      const comment = await complaintAggregate.addComment(req.user, complaintUuid, message, targetType);

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully.',
        data: comment,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async overridePriority(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;
      const { priority, reason } = req.body || {};

      if (!priority || !reason) {
        throw new ValidationError('Target priority and justification reason are required.', 'VAL_001');
      }

      const updatedComplaint = await complaintAggregate.overridePriority(req.user, complaintUuid, priority, reason);

      return res.status(200).json({
        success: true,
        message: `Complaint priority updated to ${priority} with audit record.`,
        data: updatedComplaint,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async assignTechnician(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;
      const { technicianUserUuid, technicianName, trade, notes, version } = req.body || {};

      const updated = await complaintAggregate.assignTechnician(
        req.user,
        complaintUuid,
        { technicianUserUuid, technicianName, trade, notes },
        version
      );

      return res.status(200).json({
        success: true,
        message: `Technician '${technicianName}' (${trade}) assigned for physical repair.`,
        data: updated,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTechnicianWork(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;
      const { status, resolutionNotes, evidenceUrls, version } = req.body || {};

      const updated = await complaintAggregate.updateTechnicianWork(
        req.user,
        complaintUuid,
        { status, resolutionNotes, evidenceUrls },
        version
      );

      return res.status(200).json({
        success: true,
        message: `Technician work status updated to '${status}'.`,
        data: updated,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async requestPrincipalApproval(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;
      const { policyReason, version } = req.body || {};

      const updated = await complaintAggregate.requestPrincipalApproval(
        req.user,
        complaintUuid,
        policyReason,
        version
      );

      return res.status(200).json({
        success: true,
        message: 'Principal policy approval successfully requested.',
        data: updated,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async decidePrincipalApproval(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;
      const { decision, decisionNotes, version } = req.body || {};

      const updated = await complaintAggregate.decidePrincipalApproval(
        req.user,
        complaintUuid,
        { decision, decisionNotes },
        version
      );

      return res.status(200).json({
        success: true,
        message: `Principal policy approval decision recorded as '${decision}'.`,
        data: updated,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAttachment(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const { complaintUuid } = req.params;
      const { fileName, fileType, base64Data, isEvidence } = req.body || {};

      const result = await complaintAggregate.uploadAttachment(
        req.user,
        complaintUuid,
        { fileName, fileType, base64Data, isEvidence: Boolean(isEvidence) }
      );

      return res.status(201).json({
        success: true,
        message: 'Attachment uploaded successfully.',
        data: result,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ComplaintController();
