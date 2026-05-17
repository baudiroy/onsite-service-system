const { BillingService } = require('../services/BillingService');
const { successResponse, paginationResponse } = require('../utils/responses');

class BillingController {
  constructor({ billingService = new BillingService() } = {}) {
    this.billingService = billingService;
  }

  createBillingRecord = async (req, res) => {
    const data = await this.billingService.createBillingRecord(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  getBillingRecordByCaseId = async (req, res) => {
    const data = await this.billingService.getBillingRecordByCaseId(req.params.caseId, req.user);
    return successResponse(res, data);
  };

  updateBillingRecord = async (req, res) => {
    const data = await this.billingService.updateBillingAmounts(
      req.params.billingId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  createSettlement = async (req, res) => {
    const data = await this.billingService.submitSettlement(
      req.params.billingId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  listSettlements = async (req, res) => {
    const result = await this.billingService.listSettlementRecords(req.params.billingId, req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  updateSettlement = async (req, res) => {
    const data = await this.billingService.markSettlementCompleted(
      req.params.settlementId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };
}

module.exports = {
  BillingController
};
