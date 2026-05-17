const { OrganizationService } = require('../services/OrganizationService');
const { successResponse, paginationResponse } = require('../utils/responses');

class OrganizationController {
  constructor({ organizationService = new OrganizationService() } = {}) {
    this.organizationService = organizationService;
  }

  createOrganization = async (req, res) => {
    const data = await this.organizationService.createOrganization(req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  listOrganizations = async (req, res) => {
    const result = await this.organizationService.listOrganizations(req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  getOrganization = async (req, res) => {
    const data = await this.organizationService.getOrganization(req.params.organizationId, req.user);
    return successResponse(res, data);
  };

  updateOrganization = async (req, res) => {
    const data = await this.organizationService.updateOrganization(
      req.params.organizationId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  listUserOrganizations = async (req, res) => {
    const data = await this.organizationService.listUserOrganizations(req.params.userId, req.user);
    return successResponse(res, data);
  };

  assignUserToOrganization = async (req, res) => {
    const data = await this.organizationService.assignUserToOrganization(
      req.params.userId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  removeUserFromOrganization = async (req, res) => {
    const data = await this.organizationService.removeUserFromOrganization(
      req.params.userId,
      req.params.organizationId,
      req.user,
      req
    );
    return successResponse(res, data);
  };
}

module.exports = {
  OrganizationController
};
