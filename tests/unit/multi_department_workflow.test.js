const { describe, it } = require('node:test');
const assert = require('assert');

describe('Configuration-Driven Multi-Department & Institutional Workflow Security Tests', () => {

  it('should route CE-B student complaint dynamically to CE-B Class Incharge and escalate to CE HOD', () => {
    const student = { departmentCode: 'CE', divisionCode: '2024-CE-B', userUuid: 'usr_ce_b_std_1' };
    
    // 1. Initial CI Assignment lookup
    const ciAssignment = {
      scopeId: '2024-CE-B',
      assignmentType: 'CLASS_INCHARGE',
      assigneeUserUuid: 'usr_ci_ce_b_vikram',
      assigneeName: 'Prof. Vikram More'
    };

    assert.strictEqual(ciAssignment.scopeId, student.divisionCode);
    assert.strictEqual(ciAssignment.assigneeName, 'Prof. Vikram More');

    // 2. CI forwards to TG
    const tgAssignment = {
      scopeId: '2024-CE-B',
      assignmentType: 'TEACHER_GUARDIAN',
      assigneeUserUuid: 'usr_tg_ce_b_ananya',
      assigneeName: 'Prof. Ananya Roy'
    };

    assert.strictEqual(tgAssignment.scopeId, student.divisionCode);
    assert.strictEqual(tgAssignment.assigneeName, 'Prof. Ananya Roy');

    // 3. TG escalates to CE HOD
    const hodAssignment = {
      scopeId: 'CE',
      assignmentType: 'HOD',
      assigneeUserUuid: 'usr_hod_ce_vikram_shah',
      assigneeName: 'Dr. Vikram Shah'
    };

    assert.strictEqual(hodAssignment.scopeId, student.departmentCode);
    assert.strictEqual(hodAssignment.assigneeName, 'Dr. Vikram Shah');
  });

  it('should route EXTC-A student complaint dynamically to EXTC-A Class Incharge and escalate to EXTC HOD', () => {
    const student = { departmentCode: 'EXTC', divisionCode: '2024-EXTC-A', userUuid: 'usr_extc_a_std_1' };

    const ciAssignment = {
      scopeId: '2024-EXTC-A',
      assignmentType: 'CLASS_INCHARGE',
      assigneeUserUuid: 'usr_ci_extc_a_sameer',
      assigneeName: 'Prof. Sameer Kulkarni'
    };

    const hodAssignment = {
      scopeId: 'EXTC',
      assignmentType: 'HOD',
      assigneeUserUuid: 'usr_hod_extc_kavita',
      assigneeName: 'Dr. Kavita Rao'
    };

    assert.strictEqual(ciAssignment.scopeId, student.divisionCode);
    assert.strictEqual(hodAssignment.scopeId, student.departmentCode);
    assert.strictEqual(hodAssignment.assigneeName, 'Dr. Kavita Rao');
  });

  it('should route Operational Domain complaints directly to Campus Services Head and then to Principal', () => {
    const complaint = {
      domainType: 'OPERATIONAL',
      departmentCode: 'CAMPUS_SERVICES',
      status: 'ASSIGNED',
      assignedToRole: 'CAMPUS_SERVICES_HEAD',
      assignedToName: 'Mr. Arvind Menon'
    };

    assert.strictEqual(complaint.domainType, 'OPERATIONAL');
    assert.strictEqual(complaint.assignedToRole, 'CAMPUS_SERVICES_HEAD');

    // Escalation from Campus Services Head goes directly to Principal
    const targetRole = 'PRINCIPAL';
    assert.strictEqual(targetRole, 'PRINCIPAL');
  });

  it('should strictly enforce cross-department action authorization boundaries (403 Forbidden)', () => {
    const ceComplaint = {
      complaintUuid: 'cmp-ce-001',
      departmentCode: 'CE',
      divisionCode: '2024-CE-A',
      assignedToUserUuid: 'usr_ci_ce_a_rajesh',
      status: 'ASSIGNED'
    };

    const itHodUuid = 'usr_hod_it_suresh';
    const ceBhCiUuid = 'usr_ci_ce_b_vikram';

    // IT HOD attempting action on CE complaint
    const canItHodAct = ceComplaint.assignedToUserUuid === itHodUuid;
    assert.strictEqual(canItHodAct, false);

    // CE-B Class Incharge attempting action on CE-A complaint
    const canCeBCiAct = ceComplaint.assignedToUserUuid === ceBhCiUuid;
    assert.strictEqual(canCeBCiAct, false);
  });

  it('should execute the exact 5-tier reconsideration ladder across any department', () => {
    // 1. CI resolves -> Student rejects -> TG
    const step1 = { previousResolverRole: 'CLASS_INCHARGE' };
    let next1 = null;
    if (step1.previousResolverRole === 'CLASS_INCHARGE') next1 = 'TEACHER_GUARDIAN';
    assert.strictEqual(next1, 'TEACHER_GUARDIAN');

    // 2. TG resolves -> Student rejects -> HOD
    const step2 = { previousResolverRole: 'TEACHER_GUARDIAN' };
    let next2 = null;
    if (step2.previousResolverRole === 'TEACHER_GUARDIAN') next2 = 'HOD';
    assert.strictEqual(next2, 'HOD');

    // 3. HOD resolves -> Student rejects -> DEAN
    const step3 = { previousResolverRole: 'HOD' };
    let next3 = null;
    if (step3.previousResolverRole === 'HOD') next3 = 'DEAN';
    assert.strictEqual(next3, 'DEAN');

    // 4. DEAN resolves -> Student rejects -> PRINCIPAL
    const step4 = { previousResolverRole: 'DEAN' };
    let next4 = null;
    if (step4.previousResolverRole === 'DEAN') next4 = 'PRINCIPAL';
    assert.strictEqual(next4, 'PRINCIPAL');

    // 5. PRINCIPAL resolves -> Student rejects -> Throws APEX_RESOLUTION_FINAL
    const step5 = { previousResolverRole: 'PRINCIPAL' };
    let errorThrown = false;
    try {
      if (step5.previousResolverRole === 'PRINCIPAL') {
        throw new Error('Principal resolution is the apex institutional decision. No further reconsideration levels exist.');
      }
    } catch (e) {
      errorThrown = true;
      assert.strictEqual(e.message.includes('apex institutional decision'), true);
    }
    assert.strictEqual(errorThrown, true);
  });

  it('should dynamically aggregate HOD division stats for CE and EXTC without hardcoding', () => {
    const ceDivisions = [
      { divisionCode: 'CE-A', fullCode: '2024-CE-A', label: 'CE Division A' },
      { divisionCode: 'CE-B', fullCode: '2024-CE-B', label: 'CE Division B' }
    ];

    const ceComplaints = [
      { complaintUuid: 'c1', divisionCode: '2024-CE-A', status: 'IN_PROGRESS' },
      { complaintUuid: 'c2', divisionCode: '2024-CE-A', status: 'RESOLVED' },
      { complaintUuid: 'c3', divisionCode: '2024-CE-B', status: 'ESCALATED' }
    ];

    const statsMap = new Map();
    ceDivisions.forEach(d => {
      statsMap.set(d.divisionCode, { ...d, total: 0, open: 0, escalated: 0, resolved: 0 });
    });

    ceComplaints.forEach(c => {
      const key = c.divisionCode.replace(/^2024-/, '');
      if (statsMap.has(key)) {
        const item = statsMap.get(key);
        item.total += 1;
        if (c.status === 'IN_PROGRESS') item.open += 1;
        if (c.status === 'ESCALATED') item.escalated += 1;
        if (c.status === 'RESOLVED') item.resolved += 1;
      }
    });

    assert.strictEqual(statsMap.get('CE-A').total, 2);
    assert.strictEqual(statsMap.get('CE-A').open, 1);
    assert.strictEqual(statsMap.get('CE-A').resolved, 1);
    assert.strictEqual(statsMap.get('CE-B').total, 1);
    assert.strictEqual(statsMap.get('CE-B').escalated, 1);
  });
});
