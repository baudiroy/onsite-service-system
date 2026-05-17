const express = require('express');

const { FieldServiceReportController } = require('../controllers/FieldServiceReportController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createServiceReportValidator,
  updateServiceReportValidator,
  createServicePartValidator,
  updateServicePartValidator,
  listServicePartsValidator
} = require('../validators/fieldServiceValidators');

const caseServiceReportRouter = express.Router({ mergeParams: true });
const serviceReportsRouter = express.Router();
const servicePartsRouter = express.Router();
const fieldServiceReportController = new FieldServiceReportController();

caseServiceReportRouter.post(
  '/',
  requirePermission('service_reports.manage'),
  validateRequest(createServiceReportValidator),
  asyncHandler(fieldServiceReportController.createServiceReport)
);

caseServiceReportRouter.get(
  '/',
  requirePermission('service_reports.manage'),
  asyncHandler(fieldServiceReportController.getServiceReportByCaseId)
);

serviceReportsRouter.patch(
  '/:reportId',
  requirePermission('service_reports.manage'),
  validateRequest(updateServiceReportValidator),
  asyncHandler(fieldServiceReportController.updateServiceReport)
);

serviceReportsRouter.post(
  '/:reportId/parts',
  requirePermission('service_reports.manage'),
  validateRequest(createServicePartValidator),
  asyncHandler(fieldServiceReportController.createServicePart)
);

serviceReportsRouter.get(
  '/:reportId/parts',
  requirePermission('service_reports.manage'),
  validateRequest(listServicePartsValidator),
  asyncHandler(fieldServiceReportController.listServiceParts)
);

servicePartsRouter.patch(
  '/:partId',
  requirePermission('service_reports.manage'),
  validateRequest(updateServicePartValidator),
  asyncHandler(fieldServiceReportController.updateServicePart)
);

servicePartsRouter.delete(
  '/:partId',
  requirePermission('service_reports.manage'),
  asyncHandler(fieldServiceReportController.deleteServicePart)
);

module.exports = {
  caseServiceReportRouter,
  serviceReportsRouter,
  servicePartsRouter
};
