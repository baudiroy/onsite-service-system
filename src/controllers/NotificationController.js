const { NotificationService } = require('../services/NotificationService');
const { successResponse, paginationResponse } = require('../utils/responses');

class NotificationController {
  constructor({ notificationService = new NotificationService() } = {}) {
    this.notificationService = notificationService;
  }

  listPreferences = async (req, res) => {
    const result = await this.notificationService.listPreferences(req.query);
    return paginationResponse(res, result.data, result.pagination);
  };

  createPreference = async (req, res) => {
    const data = await this.notificationService.createPreference(req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  updatePreference = async (req, res) => {
    const data = await this.notificationService.updatePreference(
      req.params.preferenceId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  listTemplates = async (req, res) => {
    const result = await this.notificationService.listTemplates(req.query);
    return paginationResponse(res, result.data, result.pagination);
  };

  createTemplate = async (req, res) => {
    const data = await this.notificationService.createTemplate(req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  updateTemplate = async (req, res) => {
    const data = await this.notificationService.updateTemplate(
      req.params.templateId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  listLogs = async (req, res) => {
    const result = await this.notificationService.listNotificationLogs(req.query);
    return paginationResponse(res, result.data, result.pagination);
  };
}

module.exports = {
  NotificationController
};
