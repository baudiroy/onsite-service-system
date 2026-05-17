const { FieldServiceReportService } = require('../services/FieldServiceReportService');
const { successResponse, paginationResponse } = require('../utils/responses');

class FieldServiceReportController {
  constructor({ fieldServiceReportService = new FieldServiceReportService() } = {}) {
    this.fieldServiceReportService = fieldServiceReportService;
  }

  createServiceReport = async (req, res) => {
    const data = await this.fieldServiceReportService.createServiceReport(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  getServiceReportByCaseId = async (req, res) => {
    const data = await this.fieldServiceReportService.getServiceReportByCaseId(req.params.caseId, req.user);
    return successResponse(res, data);
  };

  updateServiceReport = async (req, res) => {
    const data = await this.fieldServiceReportService.updateServiceReport(
      req.params.reportId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  createServicePart = async (req, res) => {
    const data = await this.fieldServiceReportService.createServicePart(
      req.params.reportId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  listServiceParts = async (req, res) => {
    const result = await this.fieldServiceReportService.listServiceParts(req.params.reportId, req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  updateServicePart = async (req, res) => {
    const data = await this.fieldServiceReportService.updateServicePart(
      req.params.partId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  deleteServicePart = async (req, res) => {
    const data = await this.fieldServiceReportService.softDeleteServicePart(
      req.params.partId,
      req.user,
      req
    );
    return successResponse(res, data);
  };
}

module.exports = {
  FieldServiceReportController
};
