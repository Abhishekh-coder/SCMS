const assert = require('assert');
const { describe, it } = require('node:test');
const { assertComplaintAccess } = require('../../backend/src/security/complaintAuthorization');

describe('Strict Role-Based Authorization & Department Data Isolation Tests', () => {

  const sampleComplaints = {
    itAcademic: {
      tenantId: 'tenant_campus_01',
      complaintUuid: 'cmp_it_academic_001',
      departmentCode: 'IT',
      divisionCode: '2024-IT-A',
      createdByUserUuid: 'usr_student_alice',
      assignedToUserUuid: 'usr_ci_it_vikram',
      technicianAssignment: null
    },
    ceAcademic: {
      tenantId: 'tenant_campus_01',
      complaintUuid: 'cmp_ce_academic_002',
      departmentCode: 'CE',
      divisionCode: '2024-CE-A',
      createdByUserUuid: 'usr_student_bob',
      assignedToUserUuid: 'usr_ci_ce_kavita',
      technicianAssignment: null
    },
    campusFacilities: {
      tenantId: 'tenant_campus_01',
      complaintUuid: 'cmp_facilities_003',
      departmentCode: 'CAMPUS_SERVICES',
      divisionCode: null,
      createdByUserUuid: 'usr_student_alice',
      assignedToUserUuid: 'usr_campus_admin_rajesh',
      technicianAssignment: {
        technicianUserUuid: 'usr_tech_sharma',
        technicianName: 'Ramesh Sharma',
        trade: 'ELECTRICAL'
      }
    },
    tenantBetaComplaint: {
      tenantId: 'tenant_beta_college',
      complaintUuid: 'cmp_beta_004',
      departmentCode: 'IT',
      createdByUserUuid: 'usr_student_charlie'
    }
  };

  const users = {
    studentAlice: {
      userUuid: 'usr_student_alice',
      primaryRole: 'STUDENT',
      roles: ['STUDENT'],
      departmentCode: 'IT',
      tenantId: 'tenant_campus_01'
    },
    studentBob: {
      userUuid: 'usr_student_bob',
      primaryRole: 'STUDENT',
      roles: ['STUDENT'],
      departmentCode: 'CE',
      tenantId: 'tenant_campus_01'
    },
    guardianAlice: {
      userUuid: 'usr_guardian_alice',
      primaryRole: 'GUARDIAN',
      roles: ['GUARDIAN'],
      linkedStudentUuid: 'usr_student_alice',
      tenantId: 'tenant_campus_01'
    },
    itFaculty: {
      userUuid: 'usr_faculty_it',
      primaryRole: 'FACULTY',
      roles: ['FACULTY'],
      departmentCode: 'IT',
      tenantId: 'tenant_campus_01'
    },
    itHod: {
      userUuid: 'usr_hod_it_suresh',
      primaryRole: 'HOD',
      roles: ['HOD'],
      departmentCode: 'IT',
      tenantId: 'tenant_campus_01'
    },
    ceHod: {
      userUuid: 'usr_hod_ce_anil',
      primaryRole: 'HOD',
      roles: ['HOD'],
      departmentCode: 'CE',
      tenantId: 'tenant_campus_01'
    },
    facilitiesStaff: {
      userUuid: 'usr_tech_sharma',
      primaryRole: 'TECHNICIAN',
      roles: ['CAMPUS_SERVICES_HEAD', 'TECHNICIAN'],
      departmentCode: 'CAMPUS_SERVICES',
      tenantId: 'tenant_campus_01'
    },
    unassignedFacilities: {
      userUuid: 'usr_tech_unassigned',
      primaryRole: 'TECHNICIAN',
      roles: ['TECHNICIAN'],
      departmentCode: 'CAMPUS_SERVICES',
      tenantId: 'tenant_campus_01'
    },
    dean: {
      userUuid: 'usr_dean_arun',
      primaryRole: 'DEAN',
      roles: ['DEAN'],
      tenantId: 'tenant_campus_01'
    },
    principal: {
      userUuid: 'usr_principal_deshmukh',
      primaryRole: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      tenantId: 'tenant_campus_01'
    },
    superAdmin: {
      userUuid: 'usr_super_admin',
      primaryRole: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      tenantId: 'tenant_campus_01'
    }
  };

  describe('1. Student Ownership & IDOR Protection', () => {
    it('should allow student to access their own complaint', () => {
      const allowed = assertComplaintAccess(users.studentAlice, sampleComplaints.itAcademic, 'READ');
      assert.strictEqual(allowed, true);
    });

    it('should prevent Student Alice from accessing Student Bob complaint', () => {
      assert.throws(() => {
        assertComplaintAccess(users.studentAlice, sampleComplaints.ceAcademic, 'READ');
      }, (err) => {
        return (err.errorCode === 'FORBIDDEN' || err.errorCode === 'FORBIDDEN_STUDENT_IDOR') && err.statusCode === 403;
      });
    });
  });

  describe('2. Department-Level Isolation for HOD & Faculty', () => {
    it('should allow IT HOD to access IT department complaint', () => {
      const allowed = assertComplaintAccess(users.itHod, sampleComplaints.itAcademic, 'READ');
      assert.strictEqual(allowed, true);
    });

    it('should prevent IT HOD from accessing CE department complaint', () => {
      assert.throws(() => {
        assertComplaintAccess(users.itHod, sampleComplaints.ceAcademic, 'READ');
      }, (err) => {
        return (err.errorCode === 'FORBIDDEN' || err.errorCode === 'FORBIDDEN_DEPARTMENT') && err.statusCode === 403;
      });
    });

    it('should allow CE HOD to access CE department complaint', () => {
      const allowed = assertComplaintAccess(users.ceHod, sampleComplaints.ceAcademic, 'READ');
      assert.strictEqual(allowed, true);
    });

    it('should prevent IT Faculty from accessing CE department complaint', () => {
      assert.throws(() => {
        assertComplaintAccess(users.itFaculty, sampleComplaints.ceAcademic, 'READ');
      }, (err) => {
        return (err.errorCode === 'FORBIDDEN' || err.errorCode === 'FORBIDDEN_DEPARTMENT') && err.statusCode === 403;
      });
    });
  });

  describe('3. Guardian Linked-Student Isolation', () => {
    it('should allow Guardian to access their linked student complaint', () => {
      const allowed = assertComplaintAccess(users.guardianAlice, sampleComplaints.itAcademic, 'READ');
      assert.strictEqual(allowed, true);
    });

    it('should prevent Guardian from accessing unrelated student complaint', () => {
      assert.throws(() => {
        assertComplaintAccess(users.guardianAlice, sampleComplaints.ceAcademic, 'READ');
      }, (err) => {
        return (err.errorCode === 'FORBIDDEN' || err.errorCode === 'FORBIDDEN_GUARDIAN') && err.statusCode === 403;
      });
    });
  });

  describe('4. Facilities / Maintenance Staff Isolation', () => {
    it('should allow assigned technician to access their campus services complaint', () => {
      const allowed = assertComplaintAccess(users.facilitiesStaff, sampleComplaints.campusFacilities, 'READ');
      assert.strictEqual(allowed, true);
    });

    it('should prevent facilities staff from accessing academic records', () => {
      assert.throws(() => {
        assertComplaintAccess(users.facilitiesStaff, sampleComplaints.itAcademic, 'READ');
      }, (err) => {
        return (err.errorCode === 'FORBIDDEN' || err.errorCode === 'FORBIDDEN_FACILITIES') && err.statusCode === 403;
      });
    });
  });

  describe('5. Dean & Institutional Oversight (Principal / Admin)', () => {
    it('should allow Dean to access authorized academic departments (IT, CE)', () => {
      assert.strictEqual(assertComplaintAccess(users.dean, sampleComplaints.itAcademic, 'READ'), true);
      assert.strictEqual(assertComplaintAccess(users.dean, sampleComplaints.ceAcademic, 'READ'), true);
    });

    it('should allow Principal apex oversight over all departments and services', () => {
      assert.strictEqual(assertComplaintAccess(users.principal, sampleComplaints.itAcademic, 'READ'), true);
      assert.strictEqual(assertComplaintAccess(users.principal, sampleComplaints.ceAcademic, 'READ'), true);
      assert.strictEqual(assertComplaintAccess(users.principal, sampleComplaints.campusFacilities, 'READ'), true);
    });

    it('should allow Super Admin institution oversight', () => {
      assert.strictEqual(assertComplaintAccess(users.superAdmin, sampleComplaints.itAcademic, 'READ'), true);
      assert.strictEqual(assertComplaintAccess(users.superAdmin, sampleComplaints.campusFacilities, 'READ'), true);
    });
  });

  describe('6. Multi-Tenant Isolation', () => {
    it('should forbid cross-tenant complaint access', () => {
      assert.throws(() => {
        assertComplaintAccess(users.studentAlice, sampleComplaints.tenantBetaComplaint, 'READ');
      }, (err) => {
        return err.errorCode === 'TENANT_MISMATCH' && err.statusCode === 403;
      });
    });
  });

  describe('7. Institutional Analytics & Map Authorization Isolation', () => {
    const analyticsController = require('../../backend/src/domains/analytics/controllers/analytics.controller');

    it('should prevent Student from accessing executive analytics dashboard', async () => {
      let capturedError = null;
      const req = {
        headers: {},
        user: { ...users.studentAlice }
      };
      const res = { status: () => res, json: () => res };
      const next = (err) => { capturedError = err; };

      await analyticsController.getExecutiveDashboard(req, res, next);
      assert.ok(capturedError, 'Expected error to be thrown for student accessing executive analytics');
      assert.strictEqual(capturedError.statusCode, 403);
      assert.strictEqual(capturedError.errorCode, 'FORBIDDEN');
    });

    it('should prevent Faculty from accessing executive analytics dashboard', async () => {
      let capturedError = null;
      const req = {
        headers: {},
        user: { ...users.itFaculty }
      };
      const res = { status: () => res, json: () => res };
      const next = (err) => { capturedError = err; };

      await analyticsController.getExecutiveDashboard(req, res, next);
      assert.ok(capturedError);
      assert.strictEqual(capturedError.statusCode, 403);
      assert.strictEqual(capturedError.errorCode, 'FORBIDDEN');
    });

    it('should prevent IT HOD from requesting CE department analytics', async () => {
      let capturedError = null;
      const req = {
        headers: {},
        user: { ...users.itHod },
        query: { departmentCode: 'CE' }
      };
      const res = { status: () => res, json: () => res };
      const next = (err) => { capturedError = err; };

      await analyticsController.getHodDashboard(req, res, next);
      assert.ok(capturedError, 'Expected cross-department analytics request to be rejected');
      assert.strictEqual(capturedError.statusCode, 403);
      assert.strictEqual(capturedError.errorCode, 'FORBIDDEN');
    });

    it('should prevent unprivileged student from exporting institutional reports', async () => {
      let capturedError = null;
      const req = {
        headers: {},
        user: { ...users.studentAlice },
        query: { format: 'json' }
      };
      const res = { status: () => res, json: () => res, setHeader: () => {} };
      const next = (err) => { capturedError = err; };

      await analyticsController.exportReport(req, res, next);
      assert.ok(capturedError);
      assert.strictEqual(capturedError.statusCode, 403);
      assert.strictEqual(capturedError.errorCode, 'FORBIDDEN');
    });
  });

});

