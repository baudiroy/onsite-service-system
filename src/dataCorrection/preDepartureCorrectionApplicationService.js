'use strict';

const {
  processDataCorrectionRequest,
} = require('./dataCorrectionRequestService');
const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_RESULTS,
  buildDataCorrectionDecisionAuditIntent,
} = require('./dataCorrectionDecisionAuditIntentBuilder');
const {
  callInjectedDecisionAuditWriter,
  callInjectedDecisionAuditWriterAsync,
} = require('./dataCorrectionDecisionAuditWriterInvocation');
const {
  CORRECTION_FIELD_GROUPS,
  DATA_CORRECTION_DECISIONS,
} = require('./dataCorrectionPolicyEngine');

const APPLICATION_STATUSES = Object.freeze({
  APPLIED: 'applied',
  BLOCKED: 'blocked',
  FAILED: 'failed',
  NOT_APPLIED: 'not_applied',
});

const WRITER_STATUSES = Object.freeze({
  RECORDED: 'recorded',
  SKIPPED: 'skipped',
  FAILED: 'failed',
});

const SAFE_PRE_DEPARTURE_FIELD_GROUPS = new Set([
  CORRECTION_FIELD_GROUPS.REPAIR_OPERATIONAL,
  CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
  CORRECTION_FIELD_GROUPS.APPOINTMENT_OPERATIONAL,
]);

const FORBIDDEN_FIELD_GROUPS = new Set([
  CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
  CORRECTION_FIELD_GROUPS.CUSTOMER_CHANNEL_IDENTITY,
  CORRECTION_FIELD_GROUPS.INTERNAL_ONLY,
  CORRECTION_FIELD_GROUPS.UNKNOWN,
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeKey(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function isSensitiveFieldKey(fieldKey) {
  const normalized = normalizeKey(fieldKey);

  return [
    'phone',
    'mobile',
    'tel',
    'lineuserid',
    'line_user_id',
    'linechannelid',
    'line_channel_id',
    'token',
    'secret',
    'password',
    'address',
    'customeraddress',
    'fulladdress',
    'internalnote',
    'airawpayload',
    'finalappointmentid',
  ].some((needle) => normalized.includes(needle));
}

function looksSensitiveString(value) {
  const trimmed = safeString(value);

  if (!trimmed) {
    return false;
  }

  const lowered = trimmed.toLowerCase();

  if (
    /token|secret|password|line_user|line user|lineuserid|raw_phone|raw_address|internal_note|ai_raw|final_appointment/.test(lowered)
  ) {
    return true;
  }

  if ((trimmed.match(/\d/g) || []).length >= 8) {
    return true;
  }

  if (/[縣市區鄉鎮路街巷弄號樓]/.test(trimmed) && /\d/.test(trimmed)) {
    return true;
  }

  return trimmed.length > 500;
}

function sanitizeToValue(fieldKey, value) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (isSensitiveFieldKey(fieldKey)) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = safeString(value);

  if (!trimmed || looksSensitiveString(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function buildSafeCorrectionPayload(input, decision) {
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
    decision: decision.decision,
    reasonCode: decision.reasonCode,
  };
  const sanitizedToValue = sanitizeToValue(correction.fieldKey, correction.toValue);

  if (sanitizedToValue !== undefined) {
    payload.correction.toValue = sanitizedToValue;
  }

  return payload;
}

function callInjectedWriter(writer, payload) {
  if (!writer) {
    return {
      status: WRITER_STATUSES.SKIPPED,
    };
  }

  const write = typeof writer === 'function'
    ? writer
    : (isPlainObject(writer) && typeof writer.write === 'function' ? writer.write.bind(writer) : null);

  if (!write) {
    return {
      status: WRITER_STATUSES.SKIPPED,
    };
  }

  try {
    const result = write(payload);

    if (
      isPlainObject(result)
      && (result.ok === false || result.persisted === false || result.recorded === false)
    ) {
      return {
        status: WRITER_STATUSES.FAILED,
        reasonCode: 'WRITER_FAILED',
        safeMessageKey: 'dataCorrection.writerFailed',
      };
    }

    return {
      status: WRITER_STATUSES.RECORDED,
    };
  } catch (error) {
    return {
      status: WRITER_STATUSES.FAILED,
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'dataCorrection.writerFailed',
    };
  }
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function mapWriterResult(result) {
  if (
    isPlainObject(result)
    && (result.ok === false || result.persisted === false || result.recorded === false)
  ) {
    return {
      status: WRITER_STATUSES.FAILED,
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'dataCorrection.writerFailed',
    };
  }

  return {
    status: WRITER_STATUSES.RECORDED,
  };
}

async function callInjectedWriterAsync(writer, payload) {
  if (!writer) {
    return {
      status: WRITER_STATUSES.SKIPPED,
    };
  }

  const write = typeof writer === 'function'
    ? writer
    : (isPlainObject(writer) && typeof writer.write === 'function' ? writer.write.bind(writer) : null);

  if (!write) {
    return {
      status: WRITER_STATUSES.SKIPPED,
    };
  }

  try {
    const result = write(payload);

    return mapWriterResult(isPromiseLike(result) ? await result : result);
  } catch (error) {
    return {
      status: WRITER_STATUSES.FAILED,
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'dataCorrection.writerFailed',
    };
  }
}

function isPreDepartureApplicationEligible(decision, input) {
  const request = isPlainObject(input) ? input : {};
  const correction = isPlainObject(request.correction) ? request.correction : {};
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};

  return Boolean(
    decision.allowed
    && decision.correctionApplicationReady
    && decision.decision === DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION
    && SAFE_PRE_DEPARTURE_FIELD_GROUPS.has(correction.fieldGroup)
    && !FORBIDDEN_FIELD_GROUPS.has(correction.fieldGroup)
    && !appointmentContext.engineerDeparted
    && !appointmentContext.routeStarted
    && !appointmentContext.arrived
  );
}

function buildBlockedResponse(decision, writerResults = {}) {
  return {
    status: APPLICATION_STATUSES.BLOCKED,
    allowed: false,
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    correctionApplicationReady: false,
    correctionApplied: false,
    phoneReverificationRequired: Boolean(decision.phoneReverificationRequired),
    manualHandlingRequired: Boolean(decision.manualHandlingRequired),
    engineerEvidenceRequired: Boolean(decision.engineerEvidenceRequired),
    engineerReconfirmRequired: Boolean(decision.engineerReconfirmRequired),
    engineerNotificationQueued: false,
    safeMessageKey: decision.safeMessageKey,
    writerResults,
  };
}

function shouldIncludeDecisionAuditIntent(options) {
  return Boolean(
    isPlainObject(options)
    && (options.includeDecisionAuditIntent || options.includeAuditIntent)
  );
}

function resultStatusForApply(response, fallbackResultStatus) {
  if (fallbackResultStatus) {
    return fallbackResultStatus;
  }

  if (!isPlainObject(response)) {
    return DATA_CORRECTION_AUDIT_RESULTS.MALFORMED;
  }

  if (response.status === APPLICATION_STATUSES.APPLIED || response.correctionApplied === true) {
    return DATA_CORRECTION_AUDIT_RESULTS.ALLOWED;
  }

  if (response.status === APPLICATION_STATUSES.FAILED) {
    return DATA_CORRECTION_AUDIT_RESULTS.WRITER_FAILED;
  }

  return DATA_CORRECTION_AUDIT_RESULTS.DENIED;
}

function withDecisionAuditIntent(response, input, options, fallbackResultStatus) {
  const auditIntent = buildDataCorrectionDecisionAuditIntent({
    ...input,
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    decisionResult: response,
    resultStatus: resultStatusForApply(response, fallbackResultStatus),
  });
  const decisionAuditWriterResult = callInjectedDecisionAuditWriter(options.decisionAuditWriter, auditIntent);

  if (!shouldIncludeDecisionAuditIntent(options)) {
    return response;
  }

  const result = {
    auditIntent,
    response,
  };

  if (decisionAuditWriterResult.status !== WRITER_STATUSES.SKIPPED) {
    result.decisionAuditWriterResult = decisionAuditWriterResult;
  }

  return result;
}

async function withDecisionAuditIntentAsync(response, input, options, fallbackResultStatus) {
  const auditIntent = buildDataCorrectionDecisionAuditIntent({
    ...input,
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    decisionResult: response,
    resultStatus: resultStatusForApply(response, fallbackResultStatus),
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

  if (decisionAuditWriterResult.status !== WRITER_STATUSES.SKIPPED) {
    result.decisionAuditWriterResult = decisionAuditWriterResult;
  }

  return result;
}

async function applyPreDepartureCorrectionAsync(input, options = {}) {
  const decision = processDataCorrectionRequest(input, {
    auditWriter: options.auditWriter,
  });
  const writerResults = {
    ...decision.writerResults,
  };

  if (!isPreDepartureApplicationEligible(decision, input)) {
    return withDecisionAuditIntentAsync(buildBlockedResponse(decision, writerResults), input, options);
  }

  const correctionPayload = buildSafeCorrectionPayload(input, decision);

  if (!correctionPayload.correction || correctionPayload.correction.toValue === undefined) {
    const response = {
      status: APPLICATION_STATUSES.BLOCKED,
      allowed: false,
      decision: decision.decision,
      reasonCode: 'UNSAFE_CORRECTION_VALUE',
      correctionApplicationReady: false,
      correctionApplied: false,
      phoneReverificationRequired: false,
      manualHandlingRequired: false,
      engineerEvidenceRequired: false,
      engineerReconfirmRequired: Boolean(decision.engineerReconfirmRequired),
      engineerNotificationQueued: false,
      safeMessageKey: 'dataCorrection.unsafeCorrectionValue',
      writerResults,
    };

    return withDecisionAuditIntentAsync(
      response,
      input,
      options,
      DATA_CORRECTION_AUDIT_RESULTS.VALIDATION_FAILED,
    );
  }

  writerResults.correction = await callInjectedWriterAsync(options.correctionWriter, correctionPayload);

  if (writerResults.correction.status !== WRITER_STATUSES.RECORDED) {
    const response = {
      status: writerResults.correction.status === WRITER_STATUSES.FAILED
        ? APPLICATION_STATUSES.FAILED
        : APPLICATION_STATUSES.NOT_APPLIED,
      allowed: false,
      decision: decision.decision,
      reasonCode: decision.reasonCode,
      correctionApplicationReady: false,
      correctionApplied: false,
      phoneReverificationRequired: false,
      manualHandlingRequired: false,
      engineerEvidenceRequired: false,
      engineerReconfirmRequired: Boolean(decision.engineerReconfirmRequired),
      engineerNotificationQueued: false,
      safeMessageKey: writerResults.correction.safeMessageKey || 'dataCorrection.correctionWriterRequired',
      writerResults,
    };

    return withDecisionAuditIntentAsync(response, input, options);
  }

  if (decision.engineerReconfirmRequired) {
    writerResults.engineerNotification = await callInjectedWriterAsync(
      options.engineerNotificationWriter,
      correctionPayload,
    );
  }

  return withDecisionAuditIntentAsync({
    status: APPLICATION_STATUSES.APPLIED,
    allowed: true,
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    correctionApplicationReady: true,
    correctionApplied: true,
    phoneReverificationRequired: false,
    manualHandlingRequired: false,
    engineerEvidenceRequired: false,
    engineerReconfirmRequired: Boolean(decision.engineerReconfirmRequired),
    engineerNotificationQueued: writerResults.engineerNotification
      ? writerResults.engineerNotification.status === WRITER_STATUSES.RECORDED
      : false,
    safeMessageKey: 'dataCorrection.applied',
    writerResults,
  }, input, options);
}

function applyPreDepartureCorrection(input, options = {}) {
  const decision = processDataCorrectionRequest(input, {
    auditWriter: options.auditWriter,
  });
  const writerResults = {
    ...decision.writerResults,
  };

  if (!isPreDepartureApplicationEligible(decision, input)) {
    return withDecisionAuditIntent(buildBlockedResponse(decision, writerResults), input, options);
  }

  const correctionPayload = buildSafeCorrectionPayload(input, decision);

  if (!correctionPayload.correction || correctionPayload.correction.toValue === undefined) {
    const response = {
      status: APPLICATION_STATUSES.BLOCKED,
      allowed: false,
      decision: decision.decision,
      reasonCode: 'UNSAFE_CORRECTION_VALUE',
      correctionApplicationReady: false,
      correctionApplied: false,
      phoneReverificationRequired: false,
      manualHandlingRequired: false,
      engineerEvidenceRequired: false,
      engineerReconfirmRequired: Boolean(decision.engineerReconfirmRequired),
      engineerNotificationQueued: false,
      safeMessageKey: 'dataCorrection.unsafeCorrectionValue',
      writerResults,
    };

    return withDecisionAuditIntent(
      response,
      input,
      options,
      DATA_CORRECTION_AUDIT_RESULTS.VALIDATION_FAILED,
    );
  }

  writerResults.correction = callInjectedWriter(options.correctionWriter, correctionPayload);

  if (writerResults.correction.status !== WRITER_STATUSES.RECORDED) {
    const response = {
      status: writerResults.correction.status === WRITER_STATUSES.FAILED
        ? APPLICATION_STATUSES.FAILED
        : APPLICATION_STATUSES.NOT_APPLIED,
      allowed: false,
      decision: decision.decision,
      reasonCode: decision.reasonCode,
      correctionApplicationReady: false,
      correctionApplied: false,
      phoneReverificationRequired: false,
      manualHandlingRequired: false,
      engineerEvidenceRequired: false,
      engineerReconfirmRequired: Boolean(decision.engineerReconfirmRequired),
      engineerNotificationQueued: false,
      safeMessageKey: writerResults.correction.safeMessageKey || 'dataCorrection.correctionWriterRequired',
      writerResults,
    };

    return withDecisionAuditIntent(response, input, options);
  }

  if (decision.engineerReconfirmRequired) {
    writerResults.engineerNotification = callInjectedWriter(options.engineerNotificationWriter, correctionPayload);
  }

  return withDecisionAuditIntent({
    status: APPLICATION_STATUSES.APPLIED,
    allowed: true,
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    correctionApplicationReady: true,
    correctionApplied: true,
    phoneReverificationRequired: false,
    manualHandlingRequired: false,
    engineerEvidenceRequired: false,
    engineerReconfirmRequired: Boolean(decision.engineerReconfirmRequired),
    engineerNotificationQueued: writerResults.engineerNotification
      ? writerResults.engineerNotification.status === WRITER_STATUSES.RECORDED
      : false,
    safeMessageKey: 'dataCorrection.applied',
    writerResults,
  }, input, options);
}

module.exports = {
  APPLICATION_STATUSES,
  WRITER_STATUSES,
  applyPreDepartureCorrection,
  applyPreDepartureCorrectionAsync,
};
