const { UserService } = require('../services/UserService');
const { successResponse, paginationResponse } = require('../utils/responses');

class UserController {
  constructor({ userService = new UserService() } = {}) {
    this.userService = userService;
  }

  createUser = async (req, res) => {
    const data = await this.userService.createUser(req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  listUsers = async (req, res) => {
    const result = await this.userService.listUsers(req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  getUser = async (req, res) => {
    const data = await this.userService.getUser(req.params.userId, req.user);
    return successResponse(res, data);
  };

  updateUser = async (req, res) => {
    const data = await this.userService.updateUser(req.params.userId, req.body, req.user, req);
    return successResponse(res, data);
  };

  disableUser = async (req, res) => {
    const data = await this.userService.disableUser(req.params.userId, req.user, req);
    return successResponse(res, data);
  };

  listUserRoles = async (req, res) => {
    const data = await this.userService.listUserRoles(req.params.userId, req.user);
    return successResponse(res, data);
  };

  assignRoleToUser = async (req, res) => {
    const data = await this.userService.assignRoleToUser(req.params.userId, req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  removeRoleFromUser = async (req, res) => {
    const data = await this.userService.removeRoleFromUser(
      req.params.userId,
      req.params.roleId,
      req.user,
      req
    );
    return successResponse(res, data);
  };
}

module.exports = {
  UserController
};
