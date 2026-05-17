const { AuthService } = require('../services/AuthService');
const { successResponse } = require('../utils/responses');

class AuthController {
  constructor({ authService = new AuthService() } = {}) {
    this.authService = authService;
  }

  login = async (req, res) => {
    const result = await this.authService.login({
      email: req.body.email,
      password: req.body.password,
      req
    });

    return successResponse(res, result);
  };

  me = async (req, res) => {
    return successResponse(res, req.user);
  };

  logout = async (req, res) => {
    return successResponse(res, {
      success: true
    });
  };
}

module.exports = {
  AuthController
};
