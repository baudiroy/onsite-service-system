const NOT_IMPLEMENTED_PROJECTION = {
  implemented: false,
  code: 'ENGINEER_MOBILE_WORKBENCH_PROJECTION_NOT_IMPLEMENTED',
  allowListOnly: true,
  data: null
};

class EngineerMobileWorkbenchProjection {
  buildNotImplementedProjection = async () => {
    return NOT_IMPLEMENTED_PROJECTION;
  };

  buildCurrentContextProjection = this.buildNotImplementedProjection;

  buildTaskListProjection = this.buildNotImplementedProjection;

  buildTaskDetailProjection = this.buildNotImplementedProjection;

  buildArrivedProjection = this.buildNotImplementedProjection;

  buildStartedProjection = this.buildNotImplementedProjection;

  buildCompletionSubmissionProjection = this.buildNotImplementedProjection;
}

module.exports = {
  EngineerMobileWorkbenchProjection
};
