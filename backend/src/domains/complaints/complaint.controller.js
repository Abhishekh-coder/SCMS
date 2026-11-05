const complaintService = require('./complaint.service');

class ComplaintController {
  async create(req, res, next) {
    try {
      const { title, description, category, departmentId } = req.body;
      const submittedBy = req.user ? req.user.id : 'usr_student_101';
      const tenantId = req.user ? req.user.tenantId : 'tenant_campus_01';
      const campusId = req.user ? req.user.campusId : 'main_campus';

      const complaint = await complaintService.createComplaint({
        title,
        description,
        category,
        departmentId,
        submittedBy,
        tenantId,
        campusId
      });

      res.status(201).json({
        success: true,
        data: complaint
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      res.json({
        success: true,
        data: [
          {
            id: 'cmp_1001',
            ticketNumber: 'CCMS-847201',
            title: 'Hostel Block B Electricity Failure',
            category: 'Infrastructure',
            priority: 'high',
            status: 'ASSIGNED',
            submittedBy: 'usr_student_101',
            tenantId: 'tenant_campus_01',
            createdAt: new Date()
          }
        ]
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ComplaintController();
