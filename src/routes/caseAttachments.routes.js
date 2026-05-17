const express = require('express');

const { AttachmentController } = require('../controllers/AttachmentController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  uploadUrlValidator,
  completeUploadValidator,
  listCaseAttachmentsValidator
} = require('../validators/attachmentValidators');

const router = express.Router({ mergeParams: true });
const attachmentController = new AttachmentController();

router.post(
  '/upload-url',
  requirePermission('attachments.create'),
  validateRequest(uploadUrlValidator),
  asyncHandler(attachmentController.generateUploadUrl)
);

router.post(
  '/complete',
  requirePermission('attachments.create'),
  validateRequest(completeUploadValidator),
  asyncHandler(attachmentController.markUploadCompleted)
);

router.get(
  '/',
  requirePermission('attachments.read'),
  validateRequest(listCaseAttachmentsValidator),
  asyncHandler(attachmentController.listCaseAttachments)
);

module.exports = {
  caseAttachmentsRouter: router
};
