const express = require('express');

const { DispatchUnitController } = require('../controllers/DispatchUnitController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createDispatchUnitValidator,
  updateDispatchUnitValidator,
  listDispatchUnitsValidator,
  getDispatchUnitValidator
} = require('../validators/dispatchUnitValidators');

const dispatchUnitsRouter = express.Router();
const dispatchUnitController = new DispatchUnitController();

dispatchUnitsRouter.get(
  '/',
  requirePermission('dispatch_units.manage'),
  validateRequest(listDispatchUnitsValidator),
  asyncHandler(dispatchUnitController.listDispatchUnits)
);

dispatchUnitsRouter.post(
  '/',
  requirePermission('dispatch_units.manage'),
  validateRequest(createDispatchUnitValidator),
  asyncHandler(dispatchUnitController.createDispatchUnit)
);

dispatchUnitsRouter.get(
  '/:dispatchUnitId',
  requirePermission('dispatch_units.manage'),
  validateRequest(getDispatchUnitValidator),
  asyncHandler(dispatchUnitController.getDispatchUnit)
);

dispatchUnitsRouter.patch(
  '/:dispatchUnitId',
  requirePermission('dispatch_units.manage'),
  validateRequest(updateDispatchUnitValidator),
  asyncHandler(dispatchUnitController.updateDispatchUnit)
);

dispatchUnitsRouter.delete(
  '/:dispatchUnitId',
  requirePermission('dispatch_units.manage'),
  validateRequest(getDispatchUnitValidator),
  asyncHandler(dispatchUnitController.disableDispatchUnit)
);

module.exports = {
  dispatchUnitsRouter
};
