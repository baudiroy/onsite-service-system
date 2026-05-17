const express = require('express');

const { MessageController } = require('../controllers/MessageController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const { deleteMessageValidator } = require('../validators/messageValidators');

const router = express.Router();
const messageController = new MessageController();

router.delete(
  '/:messageId',
  requirePermission('cases.update'),
  validateRequest(deleteMessageValidator),
  asyncHandler(messageController.softDeleteMessage)
);

module.exports = {
  messagesRouter: router
};
