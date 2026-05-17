const { AuditLogService } = require('../services/AuditLogService');
const { successResponse, paginationResponse } = require('../utils/responses');

class AuditLogController {
  constructor({ auditLogService = new AuditLogService() } = {}) {
    this.auditLogService = auditLogService;
  }

  listAuditLogs = async (req, res) => {
    const result = await this.auditLogService.listAuditLogs(req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  getAuditLogById = async (req, res) => {
    const data = await this.auditLogService.getAuditLogById(req.params.auditLogId, req.user);
    return successResponse(res, data);
  };
}

module.exports = {
  AuditLogController
};
