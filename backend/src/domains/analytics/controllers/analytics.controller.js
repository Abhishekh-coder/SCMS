const kpiEngine = require('../services/KpiEngine');
const { AppError } = require('../../../shared/errors/AppError');
const crypto = require('crypto');

class AnalyticsController {
  async getStudentDashboard(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const userUuid = req.user.userUuid;
      const kpis = await kpiEngine.calculateMetrics({ userUuid });

      return res.status(200).json({
        success: true,
        message: 'Student analytics dashboard summary retrieved.',
        data: {
          role: 'STUDENT',
          userUuid,
          kpis
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getFacultyDashboard(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const userUuid = req.user.userUuid;
      const kpis = await kpiEngine.calculateMetrics({ assignedToUserUuid: userUuid });

      return res.status(200).json({
        success: true,
        message: 'Faculty workload analytics summary retrieved.',
        data: {
          role: 'FACULTY',
          userUuid,
          kpis
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getHodDashboard(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const userRoles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : []);
      const isExecutive = userRoles.some(r => ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN', 'DEAN'].includes(r));
      const isHod = userRoles.includes('HOD');

      if (!isHod && !isExecutive) {
        throw new AppError('Access forbidden: Insufficient privileges for department analytics.', 403, 'FORBIDDEN');
      }

      const userDept = (req.user.departmentCode || req.user.department || '').toUpperCase();
      const requestedDept = (req.query.departmentCode || userDept || 'IT').toUpperCase();

      // Non-executive HOD can only access their authorized department
      if (isHod && !isExecutive) {
        if (userDept && requestedDept !== userDept) {
          throw new AppError(`Access forbidden: HOD cannot view analytics for department '${requestedDept}'.`, 403, 'FORBIDDEN');
        }
      }

      const kpis = await kpiEngine.calculateMetrics({ departmentCode: requestedDept });

      return res.status(200).json({
        success: true,
        message: 'Department HOD analytics dashboard summary retrieved.',
        data: {
          role: 'HOD',
          departmentCode: requestedDept,
          kpis
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getExecutiveDashboard(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const userRoles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : []);
      const isPrincipalOrAdmin = userRoles.some(r => ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(r));
      const isDean = userRoles.includes('DEAN');

      if (!isPrincipalOrAdmin && !isDean) {
        throw new AppError('Access forbidden: Insufficient administrative privileges to view institutional executive analytics.', 403, 'FORBIDDEN');
      }

      let query = {};
      // Deans access only authorized academic departments within their scope
      if (isDean && !isPrincipalOrAdmin) {
        query.departmentCode = { $in: ['IT', 'CE', 'EXTC', 'ACADEMIC', 'CS'] };
      }

      const kpis = await kpiEngine.calculateMetrics(query);

      return res.status(200).json({
        success: true,
        message: 'Campus Executive Summary dashboard retrieved.',
        data: {
          role: isPrincipalOrAdmin ? 'PRINCIPAL' : 'DEAN',
          kpis
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    try {
      const userRoles = req.user.roles || (req.tokenPayload ? req.tokenPayload.roles : []);
      const isAuthorized = userRoles.some(r => ['PRINCIPAL', 'SUPER_ADMIN', 'DEAN', 'HOD', 'ADMIN'].includes(r));

      if (!isAuthorized) {
        throw new AppError('Access forbidden: You do not have permissions to export institutional reports.', 403, 'FORBIDDEN');
      }

      const format = (req.query.format || 'json').toLowerCase();
      let query = {};
      if (userRoles.includes('HOD') && !userRoles.some(r => ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN', 'DEAN'].includes(r))) {
        query.departmentCode = (req.user.departmentCode || req.user.department || 'IT').toUpperCase();
      }

      const kpis = await kpiEngine.calculateMetrics(query);

      if (format === 'csv') {
        const csvContent = `Metric,Value\nTotal Complaints,${kpis.totalComplaints}\nResolved Count,${kpis.resolvedCount}\nAvg Resolution Hours,${kpis.avgResolutionHours}\nSLA Compliance %,${kpis.slaComplianceRatePct}\nEscalation %,${kpis.escalationRatePct}\nReopen %,${kpis.reopenRatePct}\n`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics_report.csv"');
        return res.status(200).send(csvContent);
      }

      return res.status(200).json({
        success: true,
        message: 'Analytics report generated.',
        data: kpis,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
