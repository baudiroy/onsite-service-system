const express = require('express');

const { CustomerInquiryController } = require('../controllers/CustomerInquiryController');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  caseInquiryValidator,
  lineCaseInquiryValidator
} = require('../validators/customerInquiryValidators');

const router = express.Router();
const customerInquiryController = new CustomerInquiryController();

router.post(
  '/case-inquiry',
  validateRequest(caseInquiryValidator),
  asyncHandler(customerInquiryController.inquiryByCaseNoAndMobile)
);

router.post(
  '/line-case-inquiry',
  validateRequest(lineCaseInquiryValidator),
  asyncHandler(customerInquiryController.inquiryByLineUserIdAndCaseNo)
);

module.exports = {
  publicRouter: router
};
