const express = require('express');

const { BillingController } = require('../controllers/BillingController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createBillingValidator,
  updateBillingValidator,
  createSettlementValidator,
  updateSettlementValidator,
  listSettlementsValidator
} = require('../validators/billingValidators');

const caseBillingRouter = express.Router({ mergeParams: true });
const billingRouter = express.Router();
const settlementsRouter = express.Router();
const billingController = new BillingController();

caseBillingRouter.post(
  '/',
  requirePermission('billing.manage'),
  validateRequest(createBillingValidator),
  asyncHandler(billingController.createBillingRecord)
);

caseBillingRouter.get(
  '/',
  requirePermission('billing.manage'),
  asyncHandler(billingController.getBillingRecordByCaseId)
);

billingRouter.patch(
  '/:billingId',
  requirePermission('billing.manage'),
  validateRequest(updateBillingValidator),
  asyncHandler(billingController.updateBillingRecord)
);

billingRouter.post(
  '/:billingId/settlements',
  requirePermission('billing.manage'),
  validateRequest(createSettlementValidator),
  asyncHandler(billingController.createSettlement)
);

billingRouter.get(
  '/:billingId/settlements',
  requirePermission('billing.manage'),
  validateRequest(listSettlementsValidator),
  asyncHandler(billingController.listSettlements)
);

settlementsRouter.patch(
  '/:settlementId',
  requirePermission('billing.manage'),
  validateRequest(updateSettlementValidator),
  asyncHandler(billingController.updateSettlement)
);

module.exports = {
  caseBillingRouter,
  billingRouter,
  settlementsRouter
};
