const { AttachmentService } = require('../services/AttachmentService');
const { successResponse } = require('../utils/responses');

class AttachmentController {
  constructor({ attachmentService = new AttachmentService() } = {}) {
    this.attachmentService = attachmentService;
  }

  generateUploadUrl = async (req, res) => {
    const data = await this.attachmentService.generateUploadUrl(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  markUploadCompleted = async (req, res) => {
    const data = await this.attachmentService.markUploadCompleted(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  listCaseAttachments = async (req, res) => {
    const data = await this.attachmentService.listCaseAttachments(req.params.caseId, req.user);
    return successResponse(res, data);
  };

  generateDownloadUrl = async (req, res) => {
    const data = await this.attachmentService.generateDownloadUrl(
      req.params.attachmentId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  requestOcrProcessing = async (req, res) => {
    const data = await this.attachmentService.requestOcrProcessing(
      req.params.attachmentId,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  softDeleteAttachment = async (req, res) => {
    const data = await this.attachmentService.softDeleteAttachment(
      req.params.attachmentId,
      req.user,
      req
    );
    return successResponse(res, data);
  };
}

module.exports = {
  AttachmentController
};
