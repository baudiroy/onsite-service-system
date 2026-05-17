const express = require('express');

const { AuditLogController } = require('../controllers/AuditLogController');
const { requirePermission } = require('../middlewares/requirePermission');
const { requireSystemOrSuperAdmin } = require('../middlewares/requireSystemOrSuperAdmin');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  listAuditLogsValidator,
  getAuditLogValidator
} = require('../validators/auditLogValidators');

const auditLogsRouter = express.Router();
const auditLogController = new AuditLogController();

auditLogsRouter.get(
  '/',
  requirePermission('audit_logs.read'),
  requireSystemOrSuperAdmin,
  validateRequest(listAuditLogsValidator),
  asyncHandler(auditLogController.listAuditLogs)
);

auditLogsRouter.get(
  '/:auditLogId',
  requirePermission('audit_logs.read'),
  requireSystemOrSuperAdmin,
  validateRequest(getAuditLogValidator),
  asyncHandler(auditLogController.getAuditLogById)
);

module.exports = {
  auditLogsRouter
};
