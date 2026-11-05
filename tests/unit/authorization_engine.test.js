const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');

const authorizationEngine = require('../../backend/src/security/authorizationEngine');
const permissionProvider = require('../../backend/src/security/permissionProvider');
const PERMISSION_CATALOG = require('../../backend/src/domains/auth/constants/permissionCatalog');
const eventPublisher = require('../../backend/src/events/publishers/EventPublisher');

describe('Sprint 3 - Authorization (RBAC / ABAC Policy Engine) Unit Tests', () => {

  const dummyUser = {
    _id: new mongoose.Types.ObjectId(),
    userUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    email: 'faculty@campus.edu',
    tenantId: 'tenant_campus_01',
    campusId: 'main_campus'
  };

  beforeEach(() => {
    permissionProvider.clearAllCache();
  });

  it('1. should verify PERMISSION_CATALOG resource:action structure', () => {
    assert.strictEqual(PERMISSION_CATALOG.COMPLAINT_CREATE.code, 'complaint:create');
    assert.strictEqual(PERMISSION_CATALOG.COMPLAINT_VIEW_DEPT.code, 'complaint:view_department');
    assert.strictEqual(PERMISSION_CATALOG.ROLE_ASSIGN.code, 'role:assign');
  });

  it('2. should evaluate static permission check using PermissionProvider', async () => {
    // Manually inject cache entry for testing
    permissionProvider.cache.set(dummyUser._id.toString(), {
      permissions: new Set(['complaint:create', 'complaint:view_own']),
      roles: ['STUDENT'],
      profileContext: { departmentId: null },
      expiresAt: Date.now() + 600000
    });

    const grantedEval = await authorizationEngine.evaluateAccess(dummyUser, 'complaint:create');
    assert.strictEqual(grantedEval.allowed, true);

    const deniedEval = await authorizationEngine.evaluateAccess(dummyUser, 'complaint:assign');
    assert.strictEqual(deniedEval.allowed, false);
    assert.strictEqual(deniedEval.reason, 'MISSING_PERMISSION_complaint:assign');
  });

  it('3. should enforce Multi-Tenancy Tenant and Campus isolation policies', async () => {
    permissionProvider.cache.set(dummyUser._id.toString(), {
      permissions: new Set(['complaint:create']),
      roles: ['STUDENT'],
      profileContext: {},
      expiresAt: Date.now() + 600000
    });

    const tenantMismatch = await authorizationEngine.evaluateAccess(dummyUser, 'complaint:create', {}, {
      tenantId: 'tenant_other_campus',
      campusId: 'main_campus'
    });
    assert.strictEqual(tenantMismatch.allowed, false);
    assert.strictEqual(tenantMismatch.reason, 'TENANT_MISMATCH_ISOLATION');

    const campusMismatch = await authorizationEngine.evaluateAccess(dummyUser, 'complaint:create', {}, {
      tenantId: 'tenant_campus_01',
      campusId: 'other_campus'
    });
    assert.strictEqual(campusMismatch.allowed, false);
    assert.strictEqual(campusMismatch.reason, 'CAMPUS_MISMATCH_ISOLATION');
  });

  it('4. should enforce ABAC Ownership Policy', async () => {
    permissionProvider.cache.set(dummyUser._id.toString(), {
      permissions: new Set(['complaint:view_own']),
      roles: ['STUDENT'],
      profileContext: {},
      expiresAt: Date.now() + 600000
    });

    // Case A: User IS the owner
    const ownerCheck = await authorizationEngine.evaluateAccess(
      dummyUser,
      'complaint:view_own',
      { checkOwnership: true },
      { tenantId: 'tenant_campus_01', campusId: 'main_campus', ownerUuid: dummyUser.userUuid }
    );
    assert.strictEqual(ownerCheck.allowed, true);

    // Case B: User is NOT the owner
    const nonOwnerCheck = await authorizationEngine.evaluateAccess(
      dummyUser,
      'complaint:view_own',
      { checkOwnership: true },
      { tenantId: 'tenant_campus_01', campusId: 'main_campus', ownerUuid: 'other-user-uuid' }
    );
    assert.strictEqual(nonOwnerCheck.allowed, false);
    assert.strictEqual(nonOwnerCheck.reason, 'OWNERSHIP_POLICY_VIOLATION');
  });

  it('5. should enforce ABAC Department Policy', async () => {
    permissionProvider.cache.set(dummyUser._id.toString(), {
      permissions: new Set(['complaint:view_department']),
      roles: ['FACULTY'],
      profileContext: { departmentId: 'CSE' },
      expiresAt: Date.now() + 600000
    });

    // Same Department
    const sameDept = await authorizationEngine.evaluateAccess(
      dummyUser,
      'complaint:view_department',
      { checkDepartment: true },
      { tenantId: 'tenant_campus_01', campusId: 'main_campus', departmentId: 'CSE' }
    );
    assert.strictEqual(sameDept.allowed, true);

    // Different Department
    const diffDept = await authorizationEngine.evaluateAccess(
      dummyUser,
      'complaint:view_department',
      { checkDepartment: true },
      { tenantId: 'tenant_campus_01', campusId: 'main_campus', departmentId: 'ECE' }
    );
    assert.strictEqual(diffDept.allowed, false);
    assert.strictEqual(diffDept.reason, 'DEPARTMENT_POLICY_VIOLATION');
  });

  it('6. should allow SYSTEM_ADMIN to bypass policy restrictions', async () => {
    permissionProvider.cache.set(dummyUser._id.toString(), {
      permissions: new Set(),
      roles: ['SYSTEM_ADMIN'],
      profileContext: {},
      expiresAt: Date.now() + 600000
    });

    const adminCheck = await authorizationEngine.evaluateAccess(
      dummyUser,
      'complaint:delete',
      { checkDepartment: true },
      { tenantId: 'tenant_campus_01', campusId: 'main_campus', departmentId: 'ECE' }
    );
    assert.strictEqual(adminCheck.allowed, true);
    assert.strictEqual(adminCheck.reason, 'SYSTEM_ADMIN_OVERRIDE');
  });

  it('7. should clear user permission cache on clearUserCache call', () => {
    permissionProvider.cache.set(dummyUser._id.toString(), {
      permissions: new Set(['complaint:create']),
      roles: ['STUDENT'],
      expiresAt: Date.now() + 600000
    });

    assert.strictEqual(permissionProvider.cache.has(dummyUser._id.toString()), true);
    permissionProvider.clearUserCache(dummyUser._id);
    assert.strictEqual(permissionProvider.cache.has(dummyUser._id.toString()), false);
  });
});
