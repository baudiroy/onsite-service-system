const express = require('express');

const { AIController } = require('../controllers/AIController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  caseAIRequestValidator,
  listAIJobsValidator,
  getAIJobValidator
} = require('../validators/aiValidators');

const caseAIRouter = express.Router({ mergeParams: true });
const aiJobsRouter = express.Router();
const aiController = new AIController();

caseAIRouter.post(
  '/summary',
  requirePermission('ai.manage'),
  validateRequest(caseAIRequestValidator),
  asyncHandler(aiController.requestCaseSummary)
);

caseAIRouter.post(
  '/classification',
  requirePermission('ai.manage'),
  validateRequest(caseAIRequestValidator),
  asyncHandler(aiController.requestCaseClassification)
);

caseAIRouter.post(
  '/dispatch-suggestion',
  requirePermission('ai.manage'),
  validateRequest(caseAIRequestValidator),
  asyncHandler(aiController.requestDispatchSuggestion)
);

aiJobsRouter.get(
  '/',
  requirePermission('ai.read'),
  validateRequest(listAIJobsValidator),
  asyncHandler(aiController.listAIJobs)
);

aiJobsRouter.get(
  '/:jobId',
  requirePermission('ai.read'),
  validateRequest(getAIJobValidator),
  asyncHandler(aiController.getAIJobById)
);

module.exports = {
  caseAIRouter,
  aiJobsRouter,
  aiController
};
