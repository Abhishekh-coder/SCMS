const { describe, it } = require('node:test');
const assert = require('assert');

describe('CCMS Shared Kernel & Security Tests', () => {
  it('should validate AppError status codes correctly', () => {
    const { AppError, UnauthorizedError } = require('../../backend/src/shared/errors/AppError');
    const err = new UnauthorizedError('Invalid Token');
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(err.errorCode, 'UNAUTHORIZED');
  });

  it('should correctly validate workflow engine transitions', () => {
    const workflowEngine = require('../../backend/src/domains/workflow/engine/workflowEngine');
    const isValid = workflowEngine.validateTransition('SUBMITTED', 'ASSIGNED');
    assert.strictEqual(isValid, true);
  });
});
