const express = require('express');

const { MessageController } = require('../controllers/MessageController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createMessageValidator,
  listMessagesValidator
} = require('../validators/messageValidators');

const router = express.Router({ mergeParams: true });
const messageController = new MessageController();

router.get(
  '/',
  requirePermission('cases.read'),
  validateRequest(listMessagesValidator),
  asyncHandler(messageController.listCaseMessages)
);

router.post(
  '/',
  requirePermission('cases.update'),
  validateRequest(createMessageValidator),
  asyncHandler(messageController.createInternalMessage)
);

module.exports = {
  caseMessagesRouter: router
};
