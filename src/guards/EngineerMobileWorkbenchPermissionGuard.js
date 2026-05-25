const NOT_IMPLEMENTED_GUARD_RESULT = {
  implemented: false,
  code: 'ENGINEER_MOBILE_WORKBENCH_PERMISSION_GUARD_NOT_IMPLEMENTED'
};

class EngineerMobileWorkbenchPermissionGuard {
  checkNotImplemented = async () => {
    return NOT_IMPLEMENTED_GUARD_RESULT;
  };

  checkCurrentContextAccess = this.checkNotImplemented;

  checkTaskListAccess = this.checkNotImplemented;

  checkTaskDetailAccess = this.checkNotImplemented;

  checkArrivedAccess = this.checkNotImplemented;

  checkStartedAccess = this.checkNotImplemented;

  checkCompletionSubmissionAccess = this.checkNotImplemented;
}

module.exports = {
  EngineerMobileWorkbenchPermissionGuard
};
