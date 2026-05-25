const { EngineerMobileWorkbenchResolver } = require('../resolvers/EngineerMobileWorkbenchResolver');
const {
  buildEngineerMobileTaskListResponseAsync
} = require('./engineerMobileController');
const {
  buildEngineerMobileTaskDetailResponseAsync
} = require('./engineerMobileTaskDetailController');
const {
  buildEngineerMobileWorkbenchContextResponseAsync
} = require('../engineerMobileWorkbench/engineerMobileWorkbenchContextService');
const {
  buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync
} = require('../engineerMobileWorkbench/engineerMobileWorkbenchTaskStatusOperationService');
const {
  buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync
} = require('../engineerMobileWorkbench/engineerMobileWorkbenchCompletionSubmissionService');

class EngineerMobileWorkbenchController {
  constructor({
    engineerMobileWorkbenchContextOptions,
    engineerMobileWorkbenchCompletionSubmissionOptions,
    engineerMobileWorkbenchTaskStatusOptions,
    engineerMobileTaskDetailOptions,
    engineerMobileTaskListOptions,
    engineerMobileWorkbenchResolver = new EngineerMobileWorkbenchResolver()
  } = {}) {
    this.engineerMobileWorkbenchContextOptions = engineerMobileWorkbenchContextOptions;
    this.engineerMobileWorkbenchCompletionSubmissionOptions = engineerMobileWorkbenchCompletionSubmissionOptions;
    this.engineerMobileWorkbenchTaskStatusOptions = engineerMobileWorkbenchTaskStatusOptions;
    this.engineerMobileTaskDetailOptions = engineerMobileTaskDetailOptions;
    this.engineerMobileTaskListOptions = engineerMobileTaskListOptions;
    this.engineerMobileWorkbenchResolver = engineerMobileWorkbenchResolver;
  }

  respondWithResolverResult = (req, res, result) => {
    return res.status(result.statusCode).json({
      error: {
        ...result.error,
        requestId: req.requestId
      }
    });
  };

  getCurrentContext = async (req, res) => {
    if (this.engineerMobileWorkbenchContextOptions) {
      const response = await buildEngineerMobileWorkbenchContextResponseAsync(
        req,
        this.engineerMobileWorkbenchContextOptions
      );

      return res.status(response.statusCode).json(response.body);
    }

    const result = await this.engineerMobileWorkbenchResolver.getCurrentContext();
    return this.respondWithResolverResult(req, res, result);
  };

  listTasks = async (req, res) => {
    if (this.engineerMobileTaskListOptions) {
      const response = await buildEngineerMobileTaskListResponseAsync(
        req,
        this.engineerMobileTaskListOptions
      );

      return res.status(response.statusCode).json(response.body);
    }

    const result = await this.engineerMobileWorkbenchResolver.listTasks();
    return this.respondWithResolverResult(req, res, result);
  };

  getTaskDetail = async (req, res) => {
    if (this.engineerMobileTaskDetailOptions) {
      const request = {
        ...req,
        params: {
          ...(req && req.params ? req.params : {}),
          appointmentId: req && req.params ? (req.params.appointmentId || req.params.taskId) : undefined
        }
      };
      const response = await buildEngineerMobileTaskDetailResponseAsync(
        request,
        this.engineerMobileTaskDetailOptions
      );

      return res.status(response.statusCode).json(response.body);
    }

    const result = await this.engineerMobileWorkbenchResolver.getTaskDetail();
    return this.respondWithResolverResult(req, res, result);
  };

  markArrived = async (req, res) => {
    if (this.engineerMobileWorkbenchTaskStatusOptions) {
      const response = await buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync(
        req,
        'arrived',
        this.engineerMobileWorkbenchTaskStatusOptions
      );

      return res.status(response.statusCode).json(response.body);
    }

    const result = await this.engineerMobileWorkbenchResolver.markArrived();
    return this.respondWithResolverResult(req, res, result);
  };

  markStarted = async (req, res) => {
    if (this.engineerMobileWorkbenchTaskStatusOptions) {
      const response = await buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync(
        req,
        'started',
        this.engineerMobileWorkbenchTaskStatusOptions
      );

      return res.status(response.statusCode).json(response.body);
    }

    const result = await this.engineerMobileWorkbenchResolver.markStarted();
    return this.respondWithResolverResult(req, res, result);
  };

  submitCompletion = async (req, res) => {
    if (this.engineerMobileWorkbenchCompletionSubmissionOptions) {
      const response = await buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync(
        req,
        this.engineerMobileWorkbenchCompletionSubmissionOptions
      );

      return res.status(response.statusCode).json(response.body);
    }

    const result = await this.engineerMobileWorkbenchResolver.submitCompletion();
    return this.respondWithResolverResult(req, res, result);
  };
}

module.exports = {
  EngineerMobileWorkbenchController
};
