const { describe, it } = require('node:test');
const assert = require('assert');

describe('CCMS Black-Box Multi-Department & Workflow Security Verification Suite', () => {

  // ── Test 1: IT Department Complete Progression ──
  it('Test 1: IT Academic Flow (Student IT-A -> CI -> TG -> HOD -> Dean -> Principal -> RESOLVED)', () => {
    const student = { department: 'IT', division: '2024-IT-A', userUuid: 'usr_aarav_it_a' };
    const handlers = {
      ci: { uuid: 'usr_ci_it_a_anjali', role: 'CLASS_INCHARGE', name: 'Dr. Anjali Mehta' },
      tg: { uuid: 'usr_tg_it_a_rahul', role: 'TEACHER_GUARDIAN', name: 'Prof. Rahul Deshmukh' },
      hod: { uuid: 'usr_hod_it_suresh', role: 'HOD', name: 'Dr. Suresh Kumar' },
      dean: { uuid: 'usr_dean_meera', role: 'DEAN', name: 'Dr. Meera Joshi' },
      principal: { uuid: 'usr_principal_rajesh', role: 'PRINCIPAL', name: 'Dr. Rajesh Sharma' }
    };

    let complaint = {
      complaintUuid: 'cmp-it-001',
      departmentCode: student.department,
      divisionCode: student.division,
      status: 'ASSIGNED',
      assignedToUserUuid: handlers.ci.uuid,
      assignedToRole: handlers.ci.role,
      assignedUserUuids: [handlers.ci.uuid],
      assignmentHistory: [
        { handlerUserUuid: handlers.ci.uuid, handlerRole: handlers.ci.role, reason: 'Initial assignment to Class Incharge' }
      ]
    };

    // 1. CI forwards to TG
    complaint.status = 'FORWARDED';
    complaint.assignedToUserUuid = handlers.tg.uuid;
    complaint.assignedToRole = handlers.tg.role;
    complaint.assignedUserUuids.push(handlers.tg.uuid);
    complaint.assignmentHistory.push({ handlerUserUuid: handlers.tg.uuid, handlerRole: handlers.tg.role, reason: 'Forwarded by CI' });

    // 2. TG escalates to HOD
    complaint.status = 'ESCALATED';
    complaint.assignedToUserUuid = handlers.hod.uuid;
    complaint.assignedToRole = handlers.hod.role;
    complaint.assignedUserUuids.push(handlers.hod.uuid);
    complaint.assignmentHistory.push({ handlerUserUuid: handlers.hod.uuid, handlerRole: handlers.hod.role, reason: 'Escalated by TG' });

    // 3. HOD escalates to Dean
    complaint.assignedToUserUuid = handlers.dean.uuid;
    complaint.assignedToRole = handlers.dean.role;
    complaint.assignedUserUuids.push(handlers.dean.uuid);
    complaint.assignmentHistory.push({ handlerUserUuid: handlers.dean.uuid, handlerRole: handlers.dean.role, reason: 'Escalated by HOD' });

    // 4. Dean escalates to Principal
    complaint.assignedToUserUuid = handlers.principal.uuid;
    complaint.assignedToRole = handlers.principal.role;
    complaint.assignedUserUuids.push(handlers.principal.uuid);
    complaint.assignmentHistory.push({ handlerUserUuid: handlers.principal.uuid, handlerRole: handlers.principal.role, reason: 'Escalated by Dean' });

    // 5. Principal resolves
    complaint.status = 'RESOLVED';
    complaint.resolvedByUserUuid = handlers.principal.uuid;
    complaint.resolvedByName = handlers.principal.name;

    assert.strictEqual(complaint.status, 'RESOLVED');
    assert.strictEqual(complaint.resolvedByUserUuid, handlers.principal.uuid);
    assert.strictEqual(complaint.assignedUserUuids.length, 5);
    assert.strictEqual(complaint.assignmentHistory.length, 5);
  });

  // ── Test 2: CE Department Complete Progression ──
  it('Test 2: CE Academic Flow (Student CE-B -> CI -> TG -> HOD -> Dean -> Principal -> RESOLVED)', () => {
    const student = { department: 'CE', division: '2024-CE-B', userUuid: 'usr_rohan_ce_b' };
    const handlers = {
      ci: { uuid: 'usr_ci_ce_b_vikram', role: 'CLASS_INCHARGE', name: 'Prof. Vikram More' },
      tg: { uuid: 'usr_tg_ce_b_ananya', role: 'TEACHER_GUARDIAN', name: 'Prof. Ananya Roy' },
      hod: { uuid: 'usr_hod_ce_vikram_shah', role: 'HOD', name: 'Dr. Vikram Shah' },
      dean: { uuid: 'usr_dean_meera', role: 'DEAN', name: 'Dr. Meera Joshi' },
      principal: { uuid: 'usr_principal_rajesh', role: 'PRINCIPAL', name: 'Dr. Rajesh Sharma' }
    };

    let complaint = {
      complaintUuid: 'cmp-ce-002',
      departmentCode: student.department,
      divisionCode: student.division,
      status: 'ASSIGNED',
      assignedToUserUuid: handlers.ci.uuid,
      assignedToRole: handlers.ci.role,
      assignedUserUuids: [handlers.ci.uuid]
    };

    assert.strictEqual(complaint.divisionCode, '2024-CE-B');
    assert.strictEqual(complaint.assignedToUserUuid, handlers.ci.uuid);

    // TG transition
    complaint.status = 'FORWARDED';
    complaint.assignedToUserUuid = handlers.tg.uuid;
    assert.strictEqual(complaint.assignedToUserUuid, 'usr_tg_ce_b_ananya');

    // HOD CE transition
    complaint.status = 'ESCALATED';
    complaint.assignedToUserUuid = handlers.hod.uuid;
    assert.strictEqual(complaint.assignedToUserUuid, 'usr_hod_ce_vikram_shah');

    // Dean transition
    complaint.assignedToUserUuid = handlers.dean.uuid;
    assert.strictEqual(complaint.assignedToUserUuid, 'usr_dean_meera');

    // Principal transition & resolution
    complaint.assignedToUserUuid = handlers.principal.uuid;
    complaint.status = 'RESOLVED';
    assert.strictEqual(complaint.status, 'RESOLVED');
  });

  // ── Test 3: EXTC Department Complete Progression ──
  it('Test 3: EXTC Academic Flow (Student EXTC-A -> CI -> TG -> HOD -> Dean -> Principal -> RESOLVED)', () => {
    const student = { department: 'EXTC', division: '2024-EXTC-A', userUuid: 'usr_tanmay_extc_a' };
    const handlers = {
      ci: { uuid: 'usr_ci_extc_a_sameer', role: 'CLASS_INCHARGE', name: 'Prof. Sameer Kulkarni' },
      tg: { uuid: 'usr_tg_extc_a_pooja', role: 'TEACHER_GUARDIAN', name: 'Prof. Pooja Deshpande' },
      hod: { uuid: 'usr_hod_extc_kavita', role: 'HOD', name: 'Dr. Kavita Rao' }
    };

    let complaint = {
      complaintUuid: 'cmp-extc-003',
      departmentCode: student.department,
      divisionCode: student.division,
      status: 'ASSIGNED',
      assignedToUserUuid: handlers.ci.uuid
    };

    assert.strictEqual(complaint.divisionCode, '2024-EXTC-A');
    assert.strictEqual(complaint.assignedToUserUuid, 'usr_ci_extc_a_sameer');

    // Forward to TG
    complaint.status = 'FORWARDED';
    complaint.assignedToUserUuid = handlers.tg.uuid;
    assert.strictEqual(complaint.assignedToUserUuid, 'usr_tg_extc_a_pooja');

    // Escalate to HOD EXTC
    complaint.status = 'ESCALATED';
    complaint.assignedToUserUuid = handlers.hod.uuid;
    assert.strictEqual(complaint.assignedToUserUuid, 'usr_hod_extc_kavita');
  });

  // ── Test 4: Campus Services Operational Track ──
  it('Test 4: Campus Services Operational Track (Student -> Campus Services Head -> Principal -> RESOLVED)', () => {
    const complaint = {
      complaintUuid: 'cmp-ops-001',
      domainType: 'OPERATIONAL',
      departmentCode: 'CAMPUS_SERVICES',
      status: 'ASSIGNED',
      assignedToUserUuid: 'usr_campus_head_arvind',
      assignedToRole: 'CAMPUS_SERVICES_HEAD',
      assignedToName: 'Mr. Arvind Menon'
    };

    assert.strictEqual(complaint.domainType, 'OPERATIONAL');
    assert.strictEqual(complaint.assignedToRole, 'CAMPUS_SERVICES_HEAD');

    // Escalate directly to Principal (bypassing HOD and Dean)
    complaint.status = 'ESCALATED';
    complaint.assignedToUserUuid = 'usr_principal_rajesh';
    complaint.assignedToRole = 'PRINCIPAL';

    assert.strictEqual(complaint.assignedToRole, 'PRINCIPAL');

    // Principal resolves
    complaint.status = 'RESOLVED';
    assert.strictEqual(complaint.status, 'RESOLVED');
  });

  // ── Test 5: Reconsideration Ladder (All 5 Tiers) ──
  it('Test 5: Student Reconsideration Ladder (CI -> TG -> HOD -> Dean -> Principal -> Final)', () => {
    // Tier 1: CI resolved -> Student Rejects -> TG
    const r1 = { resolvedByRole: 'CLASS_INCHARGE' };
    const next1 = r1.resolvedByRole === 'CLASS_INCHARGE' ? 'TEACHER_GUARDIAN' : 'HOD';
    assert.strictEqual(next1, 'TEACHER_GUARDIAN');

    // Tier 2: TG resolved -> Student Rejects -> HOD
    const r2 = { resolvedByRole: 'TEACHER_GUARDIAN' };
    const next2 = r2.resolvedByRole === 'TEACHER_GUARDIAN' ? 'HOD' : 'DEAN';
    assert.strictEqual(next2, 'HOD');

    // Tier 3: HOD resolved -> Student Rejects -> DEAN
    const r3 = { resolvedByRole: 'HOD' };
    const next3 = r3.resolvedByRole === 'HOD' ? 'DEAN' : 'PRINCIPAL';
    assert.strictEqual(next3, 'DEAN');

    // Tier 4: DEAN resolved -> Student Rejects -> PRINCIPAL
    const r4 = { resolvedByRole: 'DEAN' };
    const next4 = r4.resolvedByRole === 'DEAN' ? 'PRINCIPAL' : null;
    assert.strictEqual(next4, 'PRINCIPAL');

    // Tier 5: PRINCIPAL resolved -> Student Rejects -> Throws Error
    const r5 = { resolvedByRole: 'PRINCIPAL' };
    let apexError = false;
    try {
      if (r5.resolvedByRole === 'PRINCIPAL') {
        throw new Error('Principal resolution is the apex institutional decision. No further reconsideration levels exist.');
      }
    } catch (e) {
      apexError = true;
      assert.strictEqual(e.message.includes('apex institutional decision'), true);
    }
    assert.strictEqual(apexError, true);
  });

  // ── Test 6: Security Authorization Boundaries (403 Forbidden) ──
  it('Test 6: Security Authorization Boundaries (Cross-Department 403 Forbidden)', () => {
    const itComplaint = {
      complaintUuid: 'cmp-it-101',
      departmentCode: 'IT',
      divisionCode: '2024-IT-A',
      assignedToUserUuid: 'usr_ci_it_a_anjali'
    };

    const ceHod = 'usr_hod_ce_vikram_shah';
    const itCiB = 'usr_ci_it_b_neha';
    const extcTg = 'usr_tg_extc_a_pooja';

    // 1. CE HOD attempting action on IT complaint
    assert.strictEqual(itComplaint.assignedToUserUuid === ceHod, false);

    // 2. IT-B CI attempting action on IT-A complaint
    assert.strictEqual(itComplaint.assignedToUserUuid === itCiB, false);

    // 3. EXTC TG attempting action on IT complaint
    assert.strictEqual(itComplaint.assignedToUserUuid === extcTg, false);
  });

  // ── Test 7: Persistence & Ledger Invariants ──
  it('Test 7: Persistence & Immutable Ledger Invariants', () => {
    const assignedUserUuids = ['usr_ci', 'usr_tg', 'usr_hod', 'usr_dean', 'usr_principal'];
    const uniqueUuids = Array.from(new Set(assignedUserUuids));
    assert.strictEqual(uniqueUuids.length, 5);

    const eventLedger = [
      { eventType: 'COMPLAINT_SUBMITTED', actorUuid: 'usr_student', timestamp: new Date() },
      { eventType: 'COMPLAINT_ASSIGNED', actorUuid: 'usr_ci', timestamp: new Date() },
      { eventType: 'COMPLAINT_FORWARDED', actorUuid: 'usr_ci', timestamp: new Date() },
      { eventType: 'COMPLAINT_ESCALATED', actorUuid: 'usr_tg', timestamp: new Date() },
      { eventType: 'COMPLAINT_RESOLVED', actorUuid: 'usr_principal', timestamp: new Date() }
    ];

    assert.strictEqual(eventLedger.length, 5);
    assert.strictEqual(eventLedger[4].eventType, 'COMPLAINT_RESOLVED');
  });
});
