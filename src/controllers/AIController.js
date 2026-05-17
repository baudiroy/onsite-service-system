const { AIOrchestrationService } = require('../services/AIOrchestrationService');
const { successResponse, paginationResponse } = require('../utils/responses');

class AIController {
  constructor({ aiOrchestrationService = new AIOrchestrationService() } = {}) {
    this.aiOrchestrationService = aiOrchestrationService;
  }

  requestCaseSummary = async (req, res) => {
    const data = await this.aiOrchestrationService.requestCaseSummary(req.params.caseId, req.body, req.user, req);
    return successResponse(res, data, 202);
  };

  requestCaseClassification = async (req, res) => {
    const data = await this.aiOrchestrationService.requestCaseClassification(req.params.caseId, req.body, req.user, req);
    return successResponse(res, data, 202);
  };

  requestDispatchSuggestion = async (req, res) => {
    const data = await this.aiOrchestrationService.requestDispatchSuggestion(req.params.caseId, req.body, req.user, req);
    return successResponse(res, data, 202);
  };

  requestOCR = async (req, res) => {
    const data = await this.aiOrchestrationService.requestOCR(req.params.attachmentId, req.body, req.user, req);
    return successResponse(res, data, 202);
  };

  listAIJobs = async (req, res) => {
    const result = await this.aiOrchestrationService.listAIJobs(req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  getAIJobById = async (req, res) => {
    const data = await this.aiOrchestrationService.getAIJobById(req.params.jobId, req.user);
    return successResponse(res, data);
  };
}

module.exports = {
  AIController
};
