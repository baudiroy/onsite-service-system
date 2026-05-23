'use strict';

const {
  DATA_CORRECTION_DECISIONS,
  evaluateDataCorrectionPolicy,
} = require('./dataCorrectionPolicyEngine');
const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_RESULTS,
  buildDataCorrectionDecisionAuditIntent,
} = require('./dataCorrectionDecisionAuditIntentBuilder');
const {
  callInjectedDecisionAuditWriter,
  callInjectedDecisionAuditWriterAsync,
} = require('./dataCorrectionDecisionAuditWriterInvocation');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function safeWriterPayload(input, policy) {
  const request = isPlainObject(input) ? input : {};
  const actor = isPlainObject(request.actor) ? request.actor : {};
  const caseContext = isPlainObject(request.caseContext) ? request.caseContext : {};
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};
  const correction = isPlainObject(request.correction) ? request.correction : {};
  const payload = {
    organizationId: safeString(request.organizationId),
    caseId: safeString(caseContext.caseId),
    appointmentId: safeString(appointmentContext.appointmentId),
    actor: {
      userId: safeString(actor.userId),
      role: safeString(actor.role),
    },
    correction: {
      fieldKey: safeString(correction.fieldKey),
      fieldGroup: safeString(correction.fieldGroup),
    },
    decision: policy.decision,
    reasonCode: policy.reasonCode,
    safeMessageKey: policy.safeMessageKey,
  };
  const timestamp = safeString(request.timestamp || request.requestedAt || request.createdAt);

  if (timestamp) {
    payload.timestamp = timestamp;
  }

  return payload;
}

function callInjectedWriter(writer, payload) {
  if (!writer) {
    return {
      status: 'skipped',
    };
  }

  const write = typeof writer === 'function'
    ? writer
    : (isPlainObject(writer) && typeof writer.write === 'function' ? writer.write.bind(writer) : null);

  if (!write) {
    return {
      status: 'skipped',
    };
  }

  try {
    const result = write(payload);

    if (
      isPlainObject(result)
      && (result.ok === false || result.persisted === false || result.recorded === false)
    ) {
      return {
        status: 'failed',
        reasonCode: 'WRITER_FAILED',
        safeMessageKey: 'dataCorrection.writerFailed',
      };
    }

    return {
      status: 'recorded',
    };
  } catch (error) {
    return {
      status: 'failed',
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'dataCorrection.writerFailed',
    };
  }
}

async function callInjectedWriterAsync(writer, payload) {
  if (!writer) {
    return {
      status: 'skipped',
    };
  }

  const write = typeof writer === 'function'
    ? writer
    : (isPlainObject(writer) && typeof writer.write === 'function' ? writer.write.bind(writer) : null);

  if (!write) {
    return {
      status: 'skipped',
    };
  }

  try {
    const result = await write(payload);

    if (
      isPlainObject(result)
      && (result.ok === false || result.persisted === false || result.recorded === false)
    ) {
      return {
        status: 'failed',
        reasonCode: 'WRITER_FAILED',
        safeMessageKey: 'dataCorrection.writerFailed',
      };
    }

    return {
      status: 'recorded',
    };
  } catch (error) {
    return {
      status: 'failed',
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'dataCorrection.writerFailed',
    };
  }
}

function hasWriterFailure(writerResults) {
  if (!isPlainObject(writerResults)) {
    return false;
  }

  return Object.values(writerResults).some((result) => (
    isPlainObject(result) && result.status === 'failed'
  ));
}

function hasRequiredCorrectionInput(input) {
  const request = isPlainObject(input) ? input : {};
  const correction = isPlainObject(request.correction) ? request.correction : null;

  return Boolean(
    correction
    && safeString(correction.fieldKey)
    && safeString(correction.fieldGroup)
  );
}

function buildSafeDenyPolicy(reasonCode) {
  return {
    allowed: false,
    decision: DATA_CORRECTION_DECISIONS.SAFE_DENY,
    reasonCode,
    customerVisible: false,
    auditRequired: false,
    auditEventType: 'data_correction_blocked',
    contactLogRequired: false,
    dispatchNoteRequired: false,
    engineerReconfirmRequired: false,
    engineerEvidenceRequired: false,
    phoneReverificationRequired: false,
    safeMessageKey: 'dataCorrection.unavailable',
  };
}

function buildServiceResponse(policy, writerResults) {
  const writerFailed = hasWriterFailure(writerResults);

  return {
    status: writerFailed ? 'failed' : (policy.allowed ? 'allowed' : 'blocked'),
    allowed: policy.allowed,
    decision: policy.decision,
    reasonCode: policy.reasonCode,
    customerVisible: false,
    auditRequired: policy.auditRequired,
    auditEventType: policy.auditEventType,
    contactLogRequired: policy.contactLogRequired,
    dispatchNoteRequired: policy.dispatchNoteRequired,
    engineerReconfirmRequired: policy.engineerReconfirmRequired,
    engineerEvidenceRequired: Boolean(policy.engineerEvidenceRequired),
    phoneReverificationRequired: policy.phoneReverificationRequired,
    correctionApplicationReady: policy.allowed
      && policy.decision === DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION,
    manualHandlingRequired: Boolean(policy.contactLogRequired || policy.dispatchNoteRequired),
    safeMessageKey: writerFailed ? 'dataCorrection.writerFailed' : policy.safeMessageKey,
    writerResults,
  };
}

function shouldIncludeDecisionAuditIntent(options) {
  return Boolean(
    isPlainObject(options)
    && (options.includeDecisionAuditIntent || options.includeAuditIntent)
  );
}

function resultStatusForRequest(response, fallbackResultStatus) {
  if (fallbackResultStatus) {
    return fallbackResultStatus;
  }

  if (!isPlainObject(response)) {
    return DATA_CORRECTION_AUDIT_RESULTS.MALFORMED;
  }

  if (response.status === 'failed') {
    return DATA_CORRECTION_AUDIT_RESULTS.WRITER_FAILED;
  }

  if (response.manualHandlingRequired) {
    return DATA_CORRECTION_AUDIT_RESULTS.MANUAL_HANDLING;
  }

  return response.allowed
    ? DATA_CORRECTION_AUDIT_RESULTS.ALLOWED
    : DATA_CORRECTION_AUDIT_RESULTS.DENIED;
}

function withDecisionAuditIntent(response, input, options, fallbackResultStatus) {
  const auditIntent = buildDataCorrectionDecisionAuditIntent({
    ...input,
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    decisionResult: response,
    resultStatus: resultStatusForRequest(response, fallbackResultStatus),
  });
  const decisionAuditWriterResult = callInjectedDecisionAuditWriter(options.decisionAuditWriter, auditIntent);

  if (!shouldIncludeDecisionAuditIntent(options)) {
    return response;
  }

  const result = {
    auditIntent,
    response,
  };

  if (decisionAuditWriterResult.status !== 'skipped') {
    result.decisionAuditWriterResult = decisionAuditWriterResult;
  }

  return result;
}

async function withDecisionAuditIntentAsync(response, input, options, fallbackResultStatus) {
  const auditIntent = buildDataCorrectionDecisionAuditIntent({
    ...input,
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    decisionResult: response,
    resultStatus: resultStatusForRequest(response, fallbackResultStatus),
  });
  const decisionAuditWriterResult = await callInjectedDecisionAuditWriterAsync(
    options.decisionAuditWriter,
    auditIntent,
  );

  if (!shouldIncludeDecisionAuditIntent(options)) {
    return response;
  }

  const result = {
    auditIntent,
    response,
  };

  if (decisionAuditWriterResult.status !== 'skipped') {
    result.decisionAuditWriterResult = decisionAuditWriterResult;
  }

  return result;
}

function processDataCorrectionRequest(input, options = {}) {
  if (!hasRequiredCorrectionInput(input)) {
    const response = buildServiceResponse(buildSafeDenyPolicy('FIELD_GROUP_NOT_ALLOWED'), {});

    return withDecisionAuditIntent(
      response,
      input,
      options,
      DATA_CORRECTION_AUDIT_RESULTS.VALIDATION_FAILED,
    );
  }

  const policy = evaluateDataCorrectionPolicy(input);
  const payload = safeWriterPayload(input, policy);
  const writerResults = {};

  if (policy.auditRequired) {
    writerResults.audit = callInjectedWriter(options.auditWriter, payload);
  }

  if (policy.contactLogRequired) {
    writerResults.contactLog = callInjectedWriter(options.contactLogWriter, payload);
  }

  if (policy.dispatchNoteRequired) {
    writerResults.dispatchNote = callInjectedWriter(options.dispatchNoteWriter, payload);
  }

  return withDecisionAuditIntent(buildServiceResponse(policy, writerResults), input, options);
}

async function processDataCorrectionRequestAsync(input, options = {}) {
  if (!hasRequiredCorrectionInput(input)) {
    const response = buildServiceResponse(buildSafeDenyPolicy('FIELD_GROUP_NOT_ALLOWED'), {});

    return withDecisionAuditIntentAsync(
      response,
      input,
      options,
      DATA_CORRECTION_AUDIT_RESULTS.VALIDATION_FAILED,
    );
  }

  const policy = evaluateDataCorrectionPolicy(input);
  const payload = safeWriterPayload(input, policy);
  const writerResults = {};

  if (policy.auditRequired) {
    writerResults.audit = await callInjectedWriterAsync(options.auditWriter, payload);
  }

  if (policy.contactLogRequired) {
    writerResults.contactLog = await callInjectedWriterAsync(options.contactLogWriter, payload);
  }

  if (policy.dispatchNoteRequired) {
    writerResults.dispatchNote = await callInjectedWriterAsync(options.dispatchNoteWriter, payload);
  }

  return withDecisionAuditIntentAsync(buildServiceResponse(policy, writerResults), input, options);
}

module.exports = {
  processDataCorrectionRequest,
  processDataCorrectionRequestAsync,
};
