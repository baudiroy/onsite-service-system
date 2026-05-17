const express = require('express');

const { LineController } = require('../controllers/LineController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  lineWebhookValidator,
  listLineChannelsValidator,
  createLineChannelValidator,
  updateLineChannelValidator,
  listCustomerLineIdentitiesValidator,
  linkCustomerLineIdentityValidator,
  unlinkCustomerLineIdentityValidator
} = require('../validators/lineValidators');

const lineWebhookRouter = express.Router();
const lineChannelsRouter = express.Router();
const customerLineIdentitiesRouter = express.Router({ mergeParams: true });
const lineController = new LineController();

lineWebhookRouter.post(
  '/webhook/:channelCode',
  validateRequest(lineWebhookValidator),
  asyncHandler(lineController.handleWebhook)
);

lineChannelsRouter.get(
  '/',
  requirePermission('line.read'),
  validateRequest(listLineChannelsValidator),
  asyncHandler(lineController.listLineChannels)
);

lineChannelsRouter.post(
  '/',
  requirePermission('line.manage'),
  validateRequest(createLineChannelValidator),
  asyncHandler(lineController.createLineChannel)
);

lineChannelsRouter.patch(
  '/:channelId',
  requirePermission('line.manage'),
  validateRequest(updateLineChannelValidator),
  asyncHandler(lineController.updateLineChannel)
);

customerLineIdentitiesRouter.get(
  '/',
  requirePermission('line.read'),
  validateRequest(listCustomerLineIdentitiesValidator),
  asyncHandler(lineController.listCustomerLineIdentities)
);

customerLineIdentitiesRouter.post(
  '/',
  requirePermission('line.manage'),
  validateRequest(linkCustomerLineIdentityValidator),
  asyncHandler(lineController.linkCustomerLineIdentity)
);

customerLineIdentitiesRouter.delete(
  '/:identityId',
  requirePermission('line.manage'),
  validateRequest(unlinkCustomerLineIdentityValidator),
  asyncHandler(lineController.unlinkCustomerLineIdentity)
);

module.exports = {
  lineWebhookRouter,
  lineChannelsRouter,
  customerLineIdentitiesRouter
};
