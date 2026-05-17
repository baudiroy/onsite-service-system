const { MessageService } = require('../services/MessageService');
const { successResponse, paginationResponse } = require('../utils/responses');

class MessageController {
  constructor({ messageService = new MessageService() } = {}) {
    this.messageService = messageService;
  }

  listCaseMessages = async (req, res) => {
    const result = await this.messageService.listCaseMessages(req.params.caseId, req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  createInternalMessage = async (req, res) => {
    const data = await this.messageService.createInternalMessage(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  softDeleteMessage = async (req, res) => {
    const data = await this.messageService.softDeleteMessage(req.params.messageId, req.user, req);
    return successResponse(res, data);
  };
}

module.exports = {
  MessageController
};
