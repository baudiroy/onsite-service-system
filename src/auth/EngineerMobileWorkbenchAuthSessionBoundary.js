const NOT_IMPLEMENTED_AUTH_SESSION_CODE = 'ENGINEER_MOBILE_WORKBENCH_AUTH_SESSION_NOT_IMPLEMENTED';

function sanitizeOptionalText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue.length > 120) {
    return null;
  }

  return trimmedValue;
}

class EngineerMobileWorkbenchAuthSessionBoundary {
  buildSkeletonSessionResult = (action, requestContext = {}) => {
    return {
      implemented: false,
      code: NOT_IMPLEMENTED_AUTH_SESSION_CODE,
      authenticated: null,
      engineerContext: null,
      organizationContext: null,
      requestContextAccepted: true,
      metadata: {
        action: sanitizeOptionalText(action),
        requestId: sanitizeOptionalText(requestContext.requestId),
        clientType: sanitizeOptionalText(requestContext.clientType),
        routeName: sanitizeOptionalText(requestContext.routeName)
      }
    };
  };

  buildNotImplementedSessionBoundary = async (action, requestContext = {}) => {
    return this.buildSkeletonSessionResult(action, requestContext);
  };

  buildCurrentContextSessionBoundary = async (requestContext = {}) => {
    return this.buildNotImplementedSessionBoundary('getCurrentContext', requestContext);
  };

  buildTaskListSessionBoundary = async (requestContext = {}) => {
    return this.buildNotImplementedSessionBoundary('listTasks', requestContext);
  };

  buildTaskDetailSessionBoundary = async (requestContext = {}) => {
    return this.buildNotImplementedSessionBoundary('getTaskDetail', requestContext);
  };

  buildArrivedSessionBoundary = async (requestContext = {}) => {
    return this.buildNotImplementedSessionBoundary('markArrived', requestContext);
  };

  buildStartedSessionBoundary = async (requestContext = {}) => {
    return this.buildNotImplementedSessionBoundary('markStarted', requestContext);
  };

  buildCompletionSubmissionSessionBoundary = async (requestContext = {}) => {
    return this.buildNotImplementedSessionBoundary('submitCompletion', requestContext);
  };
}

module.exports = {
  EngineerMobileWorkbenchAuthSessionBoundary
};
