const { EngineerMobileWorkbenchAuthSessionBoundary } = require('../auth/EngineerMobileWorkbenchAuthSessionBoundary');
const {
  EngineerMobileWorkbenchCompletionSubmissionBoundary
} = require('../boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary');
const { EngineerMobileWorkbenchPermissionGuard } = require('../guards/EngineerMobileWorkbenchPermissionGuard');
const { EngineerMobileWorkbenchProjection } = require('../projections/EngineerMobileWorkbenchProjection');

const NOT_IMPLEMENTED_RESULT = {
  statusCode: 501,
  error: {
    code: 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED',
    message: 'Engineer Mobile Workbench endpoint is not implemented.',
    details: []
  }
};

class EngineerMobileWorkbenchResolver {
  constructor({
    engineerMobileWorkbenchAuthSessionBoundary = new EngineerMobileWorkbenchAuthSessionBoundary(),
    engineerMobileWorkbenchCompletionSubmissionBoundary = new EngineerMobileWorkbenchCompletionSubmissionBoundary(),
    engineerMobileWorkbenchPermissionGuard = new EngineerMobileWorkbenchPermissionGuard(),
    engineerMobileWorkbenchProjection = new EngineerMobileWorkbenchProjection()
  } = {}) {
    this.engineerMobileWorkbenchAuthSessionBoundary = engineerMobileWorkbenchAuthSessionBoundary;
    this.engineerMobileWorkbenchCompletionSubmissionBoundary = engineerMobileWorkbenchCompletionSubmissionBoundary;
    this.engineerMobileWorkbenchPermissionGuard = engineerMobileWorkbenchPermissionGuard;
    this.engineerMobileWorkbenchProjection = engineerMobileWorkbenchProjection;
  }

  resolveNotImplemented = async () => {
    return NOT_IMPLEMENTED_RESULT;
  };

  buildSkeletonRequestContext = (action) => {
    return {
      action,
      clientType: 'engineer-mobile-workbench',
      routeName: action
    };
  };

  getCurrentContext = async () => {
    await this.engineerMobileWorkbenchAuthSessionBoundary.buildCurrentContextSessionBoundary(
      this.buildSkeletonRequestContext('getCurrentContext')
    );
    await this.engineerMobileWorkbenchPermissionGuard.checkCurrentContextAccess();
    await this.engineerMobileWorkbenchProjection.buildCurrentContextProjection();
    return this.resolveNotImplemented();
  };

  listTasks = async () => {
    await this.engineerMobileWorkbenchAuthSessionBoundary.buildTaskListSessionBoundary(
      this.buildSkeletonRequestContext('listTasks')
    );
    await this.engineerMobileWorkbenchPermissionGuard.checkTaskListAccess();
    await this.engineerMobileWorkbenchProjection.buildTaskListProjection();
    return this.resolveNotImplemented();
  };

  getTaskDetail = async () => {
    await this.engineerMobileWorkbenchAuthSessionBoundary.buildTaskDetailSessionBoundary(
      this.buildSkeletonRequestContext('getTaskDetail')
    );
    await this.engineerMobileWorkbenchPermissionGuard.checkTaskDetailAccess();
    await this.engineerMobileWorkbenchProjection.buildTaskDetailProjection();
    return this.resolveNotImplemented();
  };

  markArrived = async () => {
    await this.engineerMobileWorkbenchAuthSessionBoundary.buildArrivedSessionBoundary(
      this.buildSkeletonRequestContext('markArrived')
    );
    await this.engineerMobileWorkbenchPermissionGuard.checkArrivedAccess();
    await this.engineerMobileWorkbenchProjection.buildArrivedProjection();
    return this.resolveNotImplemented();
  };

  markStarted = async () => {
    await this.engineerMobileWorkbenchAuthSessionBoundary.buildStartedSessionBoundary(
      this.buildSkeletonRequestContext('markStarted')
    );
    await this.engineerMobileWorkbenchPermissionGuard.checkStartedAccess();
    await this.engineerMobileWorkbenchProjection.buildStartedProjection();
    return this.resolveNotImplemented();
  };

  submitCompletion = async () => {
    await this.engineerMobileWorkbenchAuthSessionBoundary.buildCompletionSubmissionSessionBoundary(
      this.buildSkeletonRequestContext('submitCompletion')
    );
    await this.engineerMobileWorkbenchPermissionGuard.checkCompletionSubmissionAccess();
    await this.engineerMobileWorkbenchProjection.buildCompletionSubmissionProjection();
    await this.engineerMobileWorkbenchCompletionSubmissionBoundary.buildCompletionSubmissionBoundary();
    return this.resolveNotImplemented();
  };
}

module.exports = {
  EngineerMobileWorkbenchResolver
};
