const express = require('express');

const { CaseController } = require('../controllers/CaseController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createCaseValidator,
  updateCaseValidator,
  listCasesValidator,
  getCaseByIdValidator
} = require('../validators/caseValidators');
const {
  submitCaseValidator,
  reviewCaseValidator,
  acceptCaseValidator,
  rejectCaseValidator,
  cancelCaseValidator,
  closeCaseValidator
} = require('../validators/workflowValidators');

const router = express.Router();
const caseController = new CaseController();

router.post(
  '/',
  requirePermission('cases.create'),
  validateRequest(createCaseValidator),
  asyncHandler(caseController.createCase)
);

router.get(
  '/',
  requirePermission('cases.read'),
  validateRequest(listCasesValidator),
  asyncHandler(caseController.listCases)
);

router.post(
  '/:caseId/submit',
  requirePermission('cases.update'),
  validateRequest(submitCaseValidator),
  asyncHandler(caseController.submitCase)
);

router.post(
  '/:caseId/review',
  requirePermission('cases.review'),
  validateRequest(reviewCaseValidator),
  asyncHandler(caseController.reviewCase)
);

router.post(
  '/:caseId/accept',
  requirePermission('cases.accept'),
  validateRequest(acceptCaseValidator),
  asyncHandler(caseController.acceptCase)
);

router.post(
  '/:caseId/reject',
  requirePermission('cases.reject'),
  validateRequest(rejectCaseValidator),
  asyncHandler(caseController.rejectCase)
);

router.post(
  '/:caseId/cancel',
  requirePermission('cases.cancel'),
  validateRequest(cancelCaseValidator),
  asyncHandler(caseController.cancelCase)
);

router.post(
  '/:caseId/close',
  requirePermission('cases.close'),
  validateRequest(closeCaseValidator),
  asyncHandler(caseController.closeCase)
);

router.get(
  '/:caseId',
  requirePermission('cases.read'),
  validateRequest(getCaseByIdValidator),
  asyncHandler(caseController.getCaseById)
);

router.patch(
  '/:caseId',
  requirePermission('cases.update'),
  validateRequest(updateCaseValidator),
  asyncHandler(caseController.updateCase)
);

module.exports = {
  casesRouter: router
};
