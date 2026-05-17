const { CustomerService } = require('../services/CustomerService');
const { successResponse, paginationResponse } = require('../utils/responses');

class CustomerController {
  constructor({ customerService = new CustomerService() } = {}) {
    this.customerService = customerService;
  }

  createCustomer = async (req, res) => {
    const data = await this.customerService.createCustomer(req.body, req.user, req);
    return successResponse(res, data, 201);
  };

  listCustomers = async (req, res) => {
    const result = await this.customerService.listCustomers(req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };

  getCustomerById = async (req, res) => {
    const data = await this.customerService.getCustomerById(req.params.customerId, req.user);
    return successResponse(res, data);
  };

  updateCustomer = async (req, res) => {
    const data = await this.customerService.updateCustomer(
      req.params.customerId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  getCustomerCases = async (req, res) => {
    const result = await this.customerService.getCustomerCases(req.params.customerId, req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };
}

module.exports = {
  CustomerController
};
