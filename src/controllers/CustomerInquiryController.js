const { CustomerInquiryService } = require('../services/CustomerInquiryService');
const { successResponse } = require('../utils/responses');

class CustomerInquiryController {
  constructor({ customerInquiryService = new CustomerInquiryService() } = {}) {
    this.customerInquiryService = customerInquiryService;
  }

  inquiryByCaseNoAndMobile = async (req, res) => {
    const data = await this.customerInquiryService.inquiryByCaseNoAndMobile(req.body, req);
    return successResponse(res, data);
  };

  inquiryByLineUserIdAndCaseNo = async (req, res) => {
    const data = await this.customerInquiryService.inquiryByLineUserIdAndCaseNo(req.body, req);
    return successResponse(res, data);
  };
}

module.exports = {
  CustomerInquiryController
};
