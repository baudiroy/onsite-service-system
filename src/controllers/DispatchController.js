const { DispatchService } = require('../services/DispatchService');
const { successResponse } = require('../utils/responses');

class DispatchController {
  constructor({ dispatchService = new DispatchService() } = {}) {
    this.dispatchService = dispatchService;
  }

  createDispatch = async (req, res) => {
    const data = await this.dispatchService.assignDispatchUnit(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  updateDispatch = async (req, res) => {
    const data = await this.dispatchService.reassignEngineer(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };
}

module.exports = {
  DispatchController
};
