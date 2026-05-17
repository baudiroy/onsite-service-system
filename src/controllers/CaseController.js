const { CaseService } = require('../services/CaseService');
const { WorkflowService } = require('../services/WorkflowService');
const { successResponse, paginationResponse } = require('../utils/responses');

class CaseController {
  constructor({
    caseService = new CaseService(),
    workflowService = new WorkflowService()
  } = {}) {
    this.caseService = caseService;
    this.workflowService = workflowService;
  }

  createCase = async (req, res) => {
    const data = await this.caseService.createCase(req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  listCases = async (req, res) => {
    const result = await this.caseService.listCases(req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  getCaseById = async (req, res) => {
    const data = await this.caseService.getCaseById(req.params.caseId, req.user);
    return successResponse(res, data);
  };

  updateCase = async (req, res) => {
    const data = await this.caseService.updateCase(req.params.caseId, req.body, req.user, req);
    return successResponse(res, data);
  };

  submitCase = async (req, res) => {
    const data = await this.workflowService.transitionCase(
      req.params.caseId,
      'submit',
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  reviewCase = async (req, res) => {
    const data = await this.workflowService.transitionCase(
      req.params.caseId,
      'review',
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  acceptCase = async (req, res) => {
    const data = await this.workflowService.transitionCase(
      req.params.caseId,
      'accept',
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  rejectCase = async (req, res) => {
    const data = await this.workflowService.transitionCase(
      req.params.caseId,
      'reject',
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  cancelCase = async (req, res) => {
    const data = await this.workflowService.transitionCase(
      req.params.caseId,
      'cancel',
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  closeCase = async (req, res) => {
    const data = await this.workflowService.closeCase(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };
}

module.exports = {
  CaseController
};
