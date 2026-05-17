const { LineService } = require('../services/LineService');
const { CustomerLineIdentityService } = require('../services/CustomerLineIdentityService');
const { successResponse, paginationResponse } = require('../utils/responses');

class LineController {
  constructor({
    lineService = new LineService(),
    customerLineIdentityService = new CustomerLineIdentityService()
  } = {}) {
    this.lineService = lineService;
    this.customerLineIdentityService = customerLineIdentityService;
  }

  handleWebhook = async (req, res) => {
    const data = await this.lineService.handleWebhook({
      channelCode: req.params.channelCode,
      signature: req.get('x-line-signature'),
      rawBody: req.rawBody,
      body: req.body,
      req
    });
    return successResponse(res, data);
  };

  listLineChannels = async (req, res) => {
    const result = await this.lineService.listLineChannels(req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  createLineChannel = async (req, res) => {
    const data = await this.lineService.createLineChannel(req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  updateLineChannel = async (req, res) => {
    const data = await this.lineService.updateLineChannel(req.params.channelId, req.body, req.user, req);
    return successResponse(res, data);
  };

  listCustomerLineIdentities = async (req, res) => {
    const data = await this.customerLineIdentityService.listCustomerLineIdentities(req.params.customerId, req.user);
    return successResponse(res, data);
  };

  linkCustomerLineIdentity = async (req, res) => {
    const data = await this.customerLineIdentityService.linkCustomerLineIdentity(
      req.params.customerId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  unlinkCustomerLineIdentity = async (req, res) => {
    const data = await this.customerLineIdentityService.unlinkCustomerLineIdentity(
      req.params.customerId,
      req.params.identityId,
      req.user,
      req
    );
    return successResponse(res, data);
  };
}

module.exports = {
  LineController
};
