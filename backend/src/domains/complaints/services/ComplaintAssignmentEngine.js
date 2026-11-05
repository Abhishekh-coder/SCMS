const referenceDataService = require('../../masterData/services/ReferenceDataService');
const relationshipService = require('../../masterData/services/RelationshipService');
const mongoose = require('mongoose');
const { UserSchema } = require('../../../../../database/schema/schemas');
const { logger } = require('../../../config/logger');

const User = mongoose.models.User || mongoose.model('User', UserSchema);

class ComplaintAssignmentEngine {
  async determineAssignment(categoryCode, subcategoryCode, tenantId = 'tenant_campus_01', departmentHint = null, divisionHint = null) {
    try {
      let categoryMeta = {};
      try {
        categoryMeta = await referenceDataService.getCategoryByCode(categoryCode, subcategoryCode, tenantId);
      } catch (err) {
        categoryMeta = {
          slaHours: 48,
          domainType: (categoryCode === 'OPERATIONAL' || departmentHint === 'CAMPUS_SERVICES') ? 'OPERATIONAL' : 'ACADEMIC'
        };
      }
      const deptCode = departmentHint || (categoryMeta.autoAssignmentRule ? categoryMeta.autoAssignmentRule.targetDepartmentCode : 'CSE') || 'CSE';
      const OrganizationalAssignment = mongoose.models.OrganizationalAssignment || mongoose.model('OrganizationalAssignment');
      const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile');

      // 1. Operational Domain Routing -> Campus Services Head
      if (deptCode === 'CAMPUS_SERVICES' || categoryMeta.domainType === 'OPERATIONAL') {
        if (OrganizationalAssignment) {
          const campusAsgn = await OrganizationalAssignment.findOne({
            assignmentType: 'CAMPUS_SERVICES_HEAD',
            isActive: true
          });
          if (campusAsgn) {
            let campusUserUuid = campusAsgn.assigneeUserUuid;
            let campusName = 'Campus Services Head';
            if (!campusUserUuid && campusAsgn.assigneeUserId) {
              const u = await User.findById(campusAsgn.assigneeUserId);
              if (u) campusUserUuid = u.userUuid;
            }
            if (FacultyProfile) {
              const prof = await FacultyProfile.findOne({ userId: campusAsgn.assigneeUserId });
              if (prof) campusName = prof.fullName;
            }

            return {
              assignedToUserUuid: campusUserUuid,
              assignedToName: campusName,
              assignedToRole: 'CAMPUS_SERVICES_HEAD',
              slaHours: categoryMeta.slaHours || 48
            };
          }
        }
      }

      // 2. Division-level Academic Routing -> Class Incharge
      if (divisionHint && OrganizationalAssignment) {
        const ciAsgn = await OrganizationalAssignment.findOne({
          scopeId: divisionHint,
          assignmentType: 'CLASS_INCHARGE',
          isActive: true
        });
        if (ciAsgn) {
          let ciUserUuid = ciAsgn.assigneeUserUuid;
          let ciName = 'Class Incharge';
          if (!ciUserUuid && ciAsgn.assigneeUserId) {
            const u = await User.findById(ciAsgn.assigneeUserId);
            if (u) ciUserUuid = u.userUuid;
          }
          if (FacultyProfile) {
            const prof = await FacultyProfile.findOne({ userId: ciAsgn.assigneeUserId });
            if (prof) ciName = prof.fullName;
          }

          return {
            assignedToUserUuid: ciUserUuid,
            assignedToName: ciName,
            assignedToRole: 'CLASS_INCHARGE',
            slaHours: categoryMeta.slaHours || 48
          };
        }
      }

      // 3. Lookup HOD via generic Relationship Engine
      const hodUserUuid = await relationshipService.getRelationshipTarget('DEPARTMENT', deptCode, 'HAS_HOD');

      if (hodUserUuid) {
        const hodUser = await User.findOne({ userUuid: hodUserUuid, isDeleted: false });
        if (hodUser) {
          return {
            assignedToUserUuid: hodUser.userUuid,
            assignedToName: hodUser.fullName,
            assignedToRole: 'HOD',
            slaHours: categoryMeta.slaHours || 48
          };
        }
      }

      // Fallback Assignment to Department Admin
      return {
        assignedToUserUuid: null,
        assignedToName: `Department ${deptCode} Queue`,
        assignedToRole: categoryMeta.escalationRoleCode || 'HOD',
        slaHours: categoryMeta.slaHours || 48
      };
    } catch (error) {
      logger.warn(`⚠️ Assignment engine fallback due to lookup error: ${error.message}`);
      return {
        assignedToUserUuid: null,
        assignedToName: 'General Complaints Queue',
        assignedToRole: 'HOD',
        slaHours: 48
      };
    }
  }
}

module.exports = new ComplaintAssignmentEngine();
