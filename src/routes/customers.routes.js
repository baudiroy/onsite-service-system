const express = require('express');

const { CustomerController } = require('../controllers/CustomerController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createCustomerValidator,
  updateCustomerValidator,
  listCustomersValidator,
  getCustomerByIdValidator,
  getCustomerCasesValidator
} = require('../validators/customerValidators');

const router = express.Router();
const customerController = new CustomerController();

router.post(
  '/',
  requirePermission('customers.create'),
  validateRequest(createCustomerValidator),
  asyncHandler(customerController.createCustomer)
);

router.get(
  '/',
  requirePermission('customers.read'),
  validateRequest(listCustomersValidator),
  asyncHandler(customerController.listCustomers)
);

router.get(
  '/:customerId/cases',
  requirePermission('customers.read'),
  requirePermission('cases.read'),
  validateRequest(getCustomerCasesValidator),
  asyncHandler(customerController.getCustomerCases)
);

router.get(
  '/:customerId',
  requirePermission('customers.read'),
  validateRequest(getCustomerByIdValidator),
  asyncHandler(customerController.getCustomerById)
);

router.patch(
  '/:customerId',
  requirePermission('customers.update'),
  validateRequest(updateCustomerValidator),
  asyncHandler(customerController.updateCustomer)
);

module.exports = {
  customersRouter: router
};
