const express = require('express');
const complaintController = require('./controllers/complaint.controller');
const { authenticateToken } = require('../../security/authenticate.middleware');
const { authorize } = require('../../security/authorize.middleware');

const router = express.Router();

// All complaint routes require JWT authentication
router.use(authenticateToken);

// POST /api/v1/complaints -> Create complaint (requires complaint:create permission)
router.post('/', authorize('complaint:create'), (req, res, next) => complaintController.createComplaint(req, res, next));

// GET /api/v1/complaints -> CQRS Snapshot dashboard listing
router.get('/', (req, res, next) => complaintController.getComplaints(req, res, next));

// GET /api/v1/complaints/stats/summary -> Role-scoped dashboard summary metrics
router.get('/stats/summary', (req, res, next) => complaintController.getStatsSummary(req, res, next));

// GET /api/v1/complaints/division -> Division overview read-only complaints
router.get('/division', (req, res, next) => complaintController.getDivisionComplaints(req, res, next));

// GET /api/v1/complaints/department -> Department overview read-only complaints
router.get('/department', (req, res, next) => complaintController.getDepartmentComplaints(req, res, next));

// GET /api/v1/complaints/department-faculty -> Department faculty & staff directory
router.get('/department-faculty', (req, res, next) => complaintController.getDepartmentFaculty(req, res, next));

// GET /api/v1/complaints/dean-scope -> Dean multi-department entity overview complaints
router.get('/dean-scope', (req, res, next) => complaintController.getDeanScopeComplaints(req, res, next));

// GET /api/v1/complaints/institution -> Principal entire institution overview complaints
router.get('/institution', (req, res, next) => complaintController.getInstitutionComplaints(req, res, next));

// GET /api/v1/complaints/my-assigned -> Currently assigned actionable complaints
router.get('/my-assigned', (req, res, next) => complaintController.getMyAssignedComplaints(req, res, next));

// GET /api/v1/complaints/:complaintUuid -> Get complaint details, event ledger, and comments
router.get('/:complaintUuid', (req, res, next) => complaintController.getComplaintByUuid(req, res, next));

// POST /api/v1/complaints/:complaintUuid/actions -> State transition action with version concurrency check
router.post('/:complaintUuid/actions', (req, res, next) => complaintController.executeAction(req, res, next));

// POST /api/v1/complaints/:complaintUuid/comments -> Add typed comment (PUBLIC / INTERNAL)
router.post('/:complaintUuid/comments', (req, res, next) => complaintController.addComment(req, res, next));

// POST /api/v1/complaints/:complaintUuid/priority -> Audited priority override
router.post('/:complaintUuid/priority', (req, res, next) => complaintController.overridePriority(req, res, next));

// POST /api/v1/complaints/:complaintUuid/technician/assign -> Assign physical technician
router.post('/:complaintUuid/technician/assign', (req, res, next) => complaintController.assignTechnician(req, res, next));

// POST /api/v1/complaints/:complaintUuid/technician/status -> Technician progress, resolution notes, and evidence
router.post('/:complaintUuid/technician/status', (req, res, next) => complaintController.updateTechnicianWork(req, res, next));

// POST /api/v1/complaints/:complaintUuid/policy/request-approval -> Mandate Principal policy approval
router.post('/:complaintUuid/policy/request-approval', (req, res, next) => complaintController.requestPrincipalApproval(req, res, next));

// POST /api/v1/complaints/:complaintUuid/policy/approval-decision -> Principal policy decision (APPROVED / REJECTED)
router.post('/:complaintUuid/policy/approval-decision', (req, res, next) => complaintController.decidePrincipalApproval(req, res, next));

// POST /api/v1/complaints/:complaintUuid/attachments -> Upload file attachment or repair evidence
router.post('/:complaintUuid/attachments', (req, res, next) => complaintController.uploadAttachment(req, res, next));

module.exports = router;
