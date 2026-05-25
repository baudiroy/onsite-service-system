const express = require('express');

const { EngineerMobileWorkbenchController } = require('../controllers/EngineerMobileWorkbenchController');
const {
  createEngineerMobileWorkbenchPermissionMiddleware
} = require('../engineerMobileWorkbench/engineerMobileWorkbenchPermissionMiddleware');
const { asyncHandler } = require('../utils/asyncHandler');

function hasTaskListOptions(options = {}) {
  return Boolean(
    options.taskList
    || options.engineerMobileTaskList
    || options.tasks
    || options.readModel
    || options.readModelAsync
    || options.taskProvider
    || options.taskProviderAsync
    || options.repository
  );
}

function hasContextOptions(options = {}) {
  return Boolean(
    options.currentContext
    || options.workbenchContext
    || options.contextProvider
    || options.engineerMobileWorkbenchContext
  );
}

function hasTaskStatusOptions(options = {}) {
  return Boolean(
    options.arrivedProvider
    || options.startedProvider
    || options.taskStatusProvider
    || options.statusOperationProvider
    || options.engineerMobileWorkbenchTaskStatus
  );
}

function hasCompletionSubmissionOptions(options = {}) {
  return Boolean(
    options.completionSubmissionProvider
    || options.submissionProvider
    || options.engineerMobileWorkbenchCompletionSubmission
  );
}

function routeHandlers(options, handler) {
  if (!options.permission) {
    return [handler];
  }

  return [
    createEngineerMobileWorkbenchPermissionMiddleware(options.permission),
    handler
  ];
}

function createEngineerMobileWorkbenchRouter(options = {}) {
  const engineerMobileWorkbenchRouter = express.Router();
  const engineerMobileWorkbenchController = new EngineerMobileWorkbenchController({
    engineerMobileWorkbenchContextOptions: hasContextOptions(options) ? options : undefined,
    engineerMobileWorkbenchCompletionSubmissionOptions: hasCompletionSubmissionOptions(options) ? options : undefined,
    engineerMobileWorkbenchTaskStatusOptions: hasTaskStatusOptions(options) ? options : undefined,
    engineerMobileTaskDetailOptions: hasTaskListOptions(options) ? options : undefined,
    engineerMobileTaskListOptions: hasTaskListOptions(options) ? options : undefined
  });

  engineerMobileWorkbenchRouter.get(
    '/context',
    ...routeHandlers(options, asyncHandler(engineerMobileWorkbenchController.getCurrentContext))
  );

  engineerMobileWorkbenchRouter.get(
    '/tasks',
    ...routeHandlers(options, asyncHandler(engineerMobileWorkbenchController.listTasks))
  );

  engineerMobileWorkbenchRouter.get(
    '/tasks/:taskId',
    ...routeHandlers(options, asyncHandler(engineerMobileWorkbenchController.getTaskDetail))
  );

  engineerMobileWorkbenchRouter.post(
    '/tasks/:taskId/arrived',
    ...routeHandlers(options, asyncHandler(engineerMobileWorkbenchController.markArrived))
  );

  engineerMobileWorkbenchRouter.post(
    '/tasks/:taskId/started',
    ...routeHandlers(options, asyncHandler(engineerMobileWorkbenchController.markStarted))
  );

  engineerMobileWorkbenchRouter.post(
    '/tasks/:taskId/completion-submissions',
    ...routeHandlers(options, asyncHandler(engineerMobileWorkbenchController.submitCompletion))
  );

  return engineerMobileWorkbenchRouter;
}

const engineerMobileWorkbenchRouter = createEngineerMobileWorkbenchRouter();

module.exports = {
  createEngineerMobileWorkbenchRouter,
  engineerMobileWorkbenchRouter
};
