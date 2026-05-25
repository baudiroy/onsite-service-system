const {
  EngineerMobileWorkbenchCompletionSubmissionValidator
} = require('../validators/EngineerMobileWorkbenchCompletionSubmissionValidator');

const NOT_IMPLEMENTED_COMPLETION_SUBMISSION = {
  implemented: false,
  code: 'ENGINEER_MOBILE_WORKBENCH_COMPLETION_SUBMISSION_NOT_IMPLEMENTED',
  accepted: null,
  draftCreated: null,
  stateMutated: false,
  validation: null
};

class EngineerMobileWorkbenchCompletionSubmissionBoundary {
  constructor({
    completionSubmissionValidator = new EngineerMobileWorkbenchCompletionSubmissionValidator()
  } = {}) {
    this.completionSubmissionValidator = completionSubmissionValidator;
  }

  buildCompletionSubmissionBoundary = async () => {
    const validation = await this.completionSubmissionValidator.validateCompletionSubmissionPayload();

    return {
      ...NOT_IMPLEMENTED_COMPLETION_SUBMISSION,
      validation
    };
  };
}

module.exports = {
  EngineerMobileWorkbenchCompletionSubmissionBoundary
};
