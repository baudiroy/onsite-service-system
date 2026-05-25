const NOT_IMPLEMENTED_COMPLETION_VALIDATOR = {
  implemented: false,
  code: 'ENGINEER_MOBILE_WORKBENCH_COMPLETION_VALIDATOR_NOT_IMPLEMENTED',
  validationDecision: null,
  policy: {
    skeletonOnly: true,
    forbiddenFieldMarkers: [
      'finalAppointmentId',
      'formalFieldServiceReportContent',
      'billingSettlementAmount',
      'rawPhotoBinary',
      'rawSignatureImage'
    ],
    requiredFieldMarkers: [
      'appointmentOrDispatchVisitReference',
      'outcome'
    ]
  }
};

class EngineerMobileWorkbenchCompletionSubmissionValidator {
  validateCompletionSubmissionPayload = async () => {
    return NOT_IMPLEMENTED_COMPLETION_VALIDATOR;
  };
}

module.exports = {
  EngineerMobileWorkbenchCompletionSubmissionValidator
};
