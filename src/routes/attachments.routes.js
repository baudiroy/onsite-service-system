const express = require('express');

const { AttachmentController } = require('../controllers/AttachmentController');
const { AIController } = require('../controllers/AIController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  downloadUrlValidator,
  attachmentIdValidator
} = require('../validators/attachmentValidators');
const { ocrRequestValidator } = require('../validators/aiValidators');

const router = express.Router();
const attachmentController = new AttachmentController();
const aiController = new AIController();

router.post(
  '/:attachmentId/download-url',
  requirePermission('attachments.read'),
  validateRequest(downloadUrlValidator),
  asyncHandler(attachmentController.generateDownloadUrl)
);

router.post(
  '/:attachmentId/ocr',
  requirePermission('attachments.read'),
  requirePermission('ai.manage'),
  validateRequest(ocrRequestValidator),
  asyncHandler(aiController.requestOCR)
);

router.delete(
  '/:attachmentId',
  requirePermission('attachments.delete'),
  validateRequest(attachmentIdValidator),
  asyncHandler(attachmentController.softDeleteAttachment)
);

module.exports = {
  attachmentsRouter: router
};
