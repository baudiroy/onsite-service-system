const { DispatchUnitService } = require('../services/DispatchUnitService');
const { successResponse, paginationResponse } = require('../utils/responses');

class DispatchUnitController {
  constructor({ dispatchUnitService = new DispatchUnitService() } = {}) {
    this.dispatchUnitService = dispatchUnitService;
  }

  createDispatchUnit = async (req, res) => {
    const data = await this.dispatchUnitService.createDispatchUnit(req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  listDispatchUnits = async (req, res) => {
    const result = await this.dispatchUnitService.listDispatchUnits(req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  getDispatchUnit = async (req, res) => {
    const data = await this.dispatchUnitService.getDispatchUnit(req.params.dispatchUnitId, req.user);
    return successResponse(res, data);
  };

  updateDispatchUnit = async (req, res) => {
    const data = await this.dispatchUnitService.updateDispatchUnit(
      req.params.dispatchUnitId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  disableDispatchUnit = async (req, res) => {
    const data = await this.dispatchUnitService.disableDispatchUnit(req.params.dispatchUnitId, req.user, req);
    return successResponse(res, data);
  };
}

module.exports = {
  DispatchUnitController
};
