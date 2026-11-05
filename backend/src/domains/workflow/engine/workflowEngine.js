const complaintWorkflowConfig = require('../definitions/complaintWorkflow.json');
const { ValidationError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../config/logger');

class WorkflowEngine {
  constructor() {
    this.config = complaintWorkflowConfig;
  }

  validateTransition(currentState, targetState) {
    const stateConfig = this.config.states[currentState];
    if (!stateConfig) {
      throw new ValidationError(`Unknown workflow state '${currentState}'.`, 'VAL_WORKFLOW_STATE');
    }

    if (!stateConfig.allowedTransitions.includes(targetState)) {
      throw new ValidationError(`Illegal workflow transition from '${currentState}' to '${targetState}'.`, 'VAL_WORKFLOW_TRANSITION');
    }

    return true;
  }

  getNextPossibleStates(currentState) {
    const stateConfig = this.config.states[currentState];
    return stateConfig ? stateConfig.allowedTransitions : [];
  }

  resolveAssignmentPlan(categoryCode = '', subcategoryCode = '', tenantId = 'tenant_campus_01', departmentHint = 'IT') {
    const cat = categoryCode.toUpperCase().trim();

    // Operational categories: HOSTEL, FACILITIES, TRANSPORT, SECURITY, MESS_FOOD, IT_SERVICES
    const OPERATIONAL_CATEGORIES = ['HOSTEL', 'HOSTEL_MESS', 'FACILITIES', 'TRANSPORT', 'SECURITY', 'MESS_FOOD', 'IT_SERVICES'];
    const isOperational = OPERATIONAL_CATEGORIES.includes(cat);

    if (isOperational) {
      return {
        workflowId: `WF_OPERATIONAL_${cat}_V1`,
        workflowType: 'OPERATIONAL',
        handlerUserUuid: null, // Will be dynamically populated by ComplaintAssignmentEngine
        handlerName: 'Campus Services Head',
        handlerRole: 'CAMPUS_SERVICES_HEAD',
        slaHours: 24,
        escalationPath: ['CAMPUS_SERVICES_HEAD', 'CAMPUS_ADMIN', 'DEAN', 'PRINCIPAL']
      };
    }

    // Default: Academic Workflow (STUDENT -> CLASS_INCHARGE -> TEACHER_GUARDIAN -> HOD -> DEAN -> PRINCIPAL)
    return {
      workflowId: `WF_ACADEMIC_${cat || 'GENERAL'}_V1`,
      workflowType: 'ACADEMIC',
      handlerUserUuid: null,
      handlerName: 'Class Incharge Queue',
      handlerRole: 'CLASS_INCHARGE',
      slaHours: 48,
      escalationPath: ['CLASS_INCHARGE', 'TEACHER_GUARDIAN', 'HOD', 'DEAN', 'PRINCIPAL']
    };
  }
}

module.exports = new WorkflowEngine();
