const express = require('express');

const { DispatchController } = require('../controllers/DispatchController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createDispatchValidator,
  updateDispatchValidator
} = require('../validators/dispatchAppointmentValidators');

const router = express.Router({ mergeParams: true });
const dispatchController = new DispatchController();

router.post(
  '/',
  requirePermission('dispatch.manage'),
  validateRequest(createDispatchValidator),
  asyncHandler(dispatchController.createDispatch)
);

router.patch(
  '/',
  requirePermission('dispatch.manage'),
  validateRequest(updateDispatchValidator),
  asyncHandler(dispatchController.updateDispatch)
);

module.exports = {
  dispatchRouter: router
};
