const express = require('express');

const {
  handleBrandReferralRouteRequest
} = require('../brandChannel/brandReferralRouteAdapter');
const {
  createRepairIntakeDraftToCaseInjectedRouteComposition
} = require('../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition');
const { CustomerInquiryController } = require('../controllers/CustomerInquiryController');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  caseInquiryValidator,
  lineCaseInquiryValidator
} = require('../validators/customerInquiryValidators');

function sendBrandReferralResponse(res, response) {
  return res.status(response.statusCode).json(response.body);
}

function createBrandReferralNormalizeHandler(options = {}) {
  return (req, res) => {
    const response = handleBrandReferralRouteRequest(req, {
      requireAccessGuard: true,
      accessGuard: options.accessGuard,
      accessContext: options.accessContext,
      contactWriter: options.contactWriter
    });

    if (response && typeof response.then === 'function') {
      return response.then((resolvedResponse) => sendBrandReferralResponse(res, resolvedResponse));
    }

    return sendBrandReferralResponse(res, response);
  };
}

function getRepairIntakeDraftToCaseRuntimePorts(options = {}) {
  if (options.repairIntakeDraftToCaseRuntimePorts) {
    return options.repairIntakeDraftToCaseRuntimePorts;
  }

  if (
    options.repairIntakeDraftToCase
    && typeof options.repairIntakeDraftToCase === 'object'
    && options.repairIntakeDraftToCase.runtimePorts
  ) {
    return options.repairIntakeDraftToCase.runtimePorts;
  }

  return undefined;
}

function mountRepairIntakeDraftToCaseRoutesIfConfigured(router, options = {}) {
  const runtimePorts = getRepairIntakeDraftToCaseRuntimePorts(options);

  if (!runtimePorts) {
    return null;
  }

  return createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts,
    basePath: '/repair-intake',
    mountTarget: {
      post: router.post.bind(router)
    }
  });
}

function createPublicRouter(options = {}) {
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

  router.post(
    '/brand-referral/normalize',
    createBrandReferralNormalizeHandler(options.brandReferral || {})
  );

  mountRepairIntakeDraftToCaseRoutesIfConfigured(router, options);

  return router;
}

const publicRouter = createPublicRouter();

module.exports = {
  createPublicRouter,
  publicRouter
};
