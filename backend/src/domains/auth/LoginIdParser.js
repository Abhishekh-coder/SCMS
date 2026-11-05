/**
 * LoginIdParser
 *
 * Parses the loginId string to determine:
 *   - profile type (STUDENT / FACULTY / ADMIN)
 *   - component parts (batch, dept, division, roll, employeeCode, etc.)
 *
 * Called at login before DB lookup so we know which collection to query.
 * No regex hardcoding outside this file.
 *
 * Login ID Conventions:
 *   Student   : 2024-IT-A-059-STD
 *   Faculty   : EMP-IT-0031
 *   Principal : EMP-0001             (EMP + 4-digit, no dept segment)
 *   Admin     : ADM-0001
 *   Super Admin: SYS-0001
 */

const { PROFILE_TYPE } = require('../../shared/constants/roles');

// All patterns defined once here
const PATTERNS = {
  // 2024-IT-A-059-STD  (batch-DEPT-DIVISION-roll-STD)
  STUDENT: /^(\d{4})-([A-Z]+)-([A-Z])-(\d{3})-STD$/i,

  // EMP-IT-0031  (EMP-DEPT-number)
  FACULTY: /^EMP-([A-Z]+)-(\d{3,6})$/i,

  // EMP-0001  (EMP + 4 digits, no dept = Principal / HOD at campus level)
  PRINCIPAL: /^EMP-(\d{4,6})$/i,

  // ADM-0001
  ADMIN: /^ADM-(\d{4,6})$/i,

  // SYS-0001
  SUPER_ADMIN: /^SYS-(\d{4,6})$/i,
};

function parseLoginId(rawLoginId) {
  if (!rawLoginId || typeof rawLoginId !== 'string') {
    return { valid: false, reason: 'Login ID must be a non-empty string.' };
  }

  const id = rawLoginId.trim().toUpperCase();

  // ── Student ──────────────────────────────────────────────────────────────
  let match = id.match(PATTERNS.STUDENT);
  if (match) {
    return {
      valid:       true,
      loginId:     id,
      profileType: PROFILE_TYPE.STUDENT,
      parsed: {
        admissionBatch: parseInt(match[1], 10),   // 2024
        department:     match[2],                  // IT
        division:       match[3],                  // A
        rollNo:         match[4],                  // 059
        suffix:         'STD',
      },
    };
  }

  // ── Faculty (with dept) ───────────────────────────────────────────────────
  match = id.match(PATTERNS.FACULTY);
  if (match) {
    return {
      valid:       true,
      loginId:     id,
      profileType: PROFILE_TYPE.FACULTY,
      parsed: {
        employeeCode: id,
        department:   match[1],   // IT
        number:       match[2],   // 0031
      },
    };
  }

  // ── Principal / campus-level HOD (EMP-0001) ───────────────────────────────
  match = id.match(PATTERNS.PRINCIPAL);
  if (match) {
    return {
      valid:       true,
      loginId:     id,
      profileType: PROFILE_TYPE.FACULTY,  // Still stored as faculty profile
      parsed: {
        employeeCode: id,
        department:   null,   // Campus-level — no dept
        number:       match[1],
        isPrincipalFormat: true,
      },
    };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  match = id.match(PATTERNS.ADMIN);
  if (match) {
    return {
      valid:       true,
      loginId:     id,
      profileType: PROFILE_TYPE.ADMIN,
      parsed: {
        adminCode: id,
        number:    match[1],
      },
    };
  }

  // ── Super Admin ───────────────────────────────────────────────────────────
  match = id.match(PATTERNS.SUPER_ADMIN);
  if (match) {
    return {
      valid:       true,
      loginId:     id,
      profileType: PROFILE_TYPE.ADMIN,
      parsed: {
        adminCode: id,
        number:    match[1],
        isSuperAdmin: true,
      },
    };
  }

  return {
    valid:  false,
    reason: `Unrecognized login ID format: '${rawLoginId}'. ` +
            `Expected formats: 2024-IT-A-059-STD | EMP-IT-0031 | EMP-0001 | ADM-0001 | SYS-0001`,
  };
}

module.exports = { parseLoginId, PATTERNS };
