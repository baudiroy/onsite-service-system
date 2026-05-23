'use strict';

const {
  processDataCorrectionRequest,
  processDataCorrectionRequestAsync,
} = require('./dataCorrectionRequestService');
const {
  applyPreDepartureCorrection,
  applyPreDepartureCorrectionAsync,
} = require('./preDepartureCorrectionApplicationService');
const {
  handlePostDepartureCorrectionFreeze,
  handlePostDepartureCorrectionFreezeAsync,
} = require('./postDepartureCorrectionFreezeService');
const {
  recordUnableToCompleteAppointmentResult,
  recordUnableToCompleteAppointmentResultAsync,
} = require('./unableToCompleteAppointmentResultService');
const {
  proposeFollowUpAppointment,
  proposeFollowUpAppointmentAsync,
} = require('./followUpAppointmentProposalService');

const DATA_CORRECTION_GOVERNANCE_ACTIONS = Object.freeze({
  DATA_CORRECTION_REQUEST: 'data_correction_request',
  PRE_DEPARTURE_APPLY: 'pre_departure_apply',
  POST_DEPARTURE_FREEZE: 'post_departure_freeze',
  UNABLE_TO_COMPLETE_RESULT: 'unable_to_complete_result',
  FOLLOW_UP_PROPOSAL: 'follow_up_proposal',
});

const DATA_CORRECTION_GOVERNANCE_ACTION_ORDER = Object.freeze(
  Object.values(DATA_CORRECTION_GOVERNANCE_ACTIONS),
);

const DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER = Object.freeze([
  DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
  DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
  DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
  DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
  DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
]);

const DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES = Object.freeze({
  DENY: 'deny',
  FAILED: 'failed',
  OK: 'ok',
});

const DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS = Object.freeze([
  'actionType',
  'payload.actionType',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function looksSensitiveString(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();

  return /raw_phone|raw_address|line_user|lineuserid|token|secret|password|internal_note|ai_raw|final_appointment/.test(lowered);
}

function isForbiddenKey(key) {
  if (key === 'phoneReverificationRequired') {
    return false;
  }

  return /phone|lineuserid|line_user_id|token|secret|password|internalnote|airaw|rawpayload|finalappointmentid/i.test(String(key));
}

function sanitizeForEnvelope(value) {
  if (Array.isArray(value)) {
    return value
      .map(sanitizeForEnvelope)
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const sanitized = {};

    for (const [key, childValue] of Object.entries(value)) {
      if (isForbiddenKey(key)) {
        continue;
      }

      const safeValue = sanitizeForEnvelope(childValue);

      if (safeValue !== undefined) {
        sanitized[key] = safeValue;
      }
    }

    return sanitized;
  }

  if (looksSensitiveString(value)) {
    return undefined;
  }

  return value;
}

function safeDeny(reasonCode) {
  return {
    handled: false,
    status: DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY,
    decision: 'safe_deny',
    reasonCode,
    safeMessageKey: 'dataCorrection.unavailable',
  };
}

function resolveActionRequest(input) {
  const request = isPlainObject(input) ? input : {};
  const payload = isPlainObject(request.payload) ? request.payload : request;
  const actionType = normalize(
    request[DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS[0]]
    || payload.actionType,
  );

  return {
    actionType,
    payload,
  };
}

function callAction(actionType, payload, options) {
  switch (actionType) {
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST:
      return processDataCorrectionRequest(payload, options);
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY:
      return applyPreDepartureCorrection(payload, options);
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE:
      return handlePostDepartureCorrectionFreeze(payload, options);
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT:
      return recordUnableToCompleteAppointmentResult(payload, options);
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL:
      return proposeFollowUpAppointment(payload, options);
    default:
      return null;
  }
}

async function callActionAsync(actionType, payload, options) {
  switch (actionType) {
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST:
      return processDataCorrectionRequestAsync(payload, options);
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY:
      return applyPreDepartureCorrectionAsync(payload, options);
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE:
      return handlePostDepartureCorrectionFreezeAsync(payload, options);
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT:
      return recordUnableToCompleteAppointmentResultAsync(payload, options);
    case DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL:
      return proposeFollowUpAppointmentAsync(payload, options);
    default:
      return callAction(actionType, payload, options);
  }
}

function mapEnvelopeStatus(result) {
  if (!isPlainObject(result)) {
    return DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY;
  }

  if (result.status === 'failed') {
    return DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.FAILED;
  }

  if (result.manualHandlingRequired && !result.phoneReverificationRequired && !result.engineerEvidenceRequired) {
    return 'ok';
  }

  if (
    result.status === 'deny'
    || result.status === 'denied'
    || result.status === 'blocked'
    || result.status === 'not_applicable'
    || result.allowed === false
  ) {
    return DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY;
  }

  return DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.OK;
}

function resolveSafeMessageKey(result, status) {
  if (isPlainObject(result) && result.safeMessageKey) {
    return result.safeMessageKey;
  }

  return status === DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.OK
    ? 'dataCorrection.ok'
    : 'dataCorrection.unavailable';
}

function runDataCorrectionGovernanceAction(input, options = {}) {
  const { actionType, payload } = resolveActionRequest(input);

  if (!actionType) {
    return safeDeny('MISSING_ACTION_TYPE');
  }

  const result = callAction(actionType, payload, options);

  if (!result) {
    return safeDeny('UNKNOWN_ACTION_TYPE');
  }

  const safeResult = sanitizeForEnvelope(result);
  const status = mapEnvelopeStatus(safeResult);

  return {
    handled: status !== DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY,
    actionType,
    status,
    decision: safeResult.decision || safeResult.status || status,
    result: safeResult,
    safeMessageKey: resolveSafeMessageKey(safeResult, status),
  };
}

async function runDataCorrectionGovernanceActionAsync(input, options = {}) {
  const { actionType, payload } = resolveActionRequest(input);

  if (!actionType) {
    return safeDeny('MISSING_ACTION_TYPE');
  }

  const result = await callActionAsync(actionType, payload, options);

  if (!result) {
    return safeDeny('UNKNOWN_ACTION_TYPE');
  }

  const safeResult = sanitizeForEnvelope(result);
  const status = mapEnvelopeStatus(safeResult);

  return {
    handled: status !== DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY,
    actionType,
    status,
    decision: safeResult.decision || safeResult.status || status,
    result: safeResult,
    safeMessageKey: resolveSafeMessageKey(safeResult, status),
  };
}

module.exports = {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
  DATA_CORRECTION_GOVERNANCE_ACTION_ORDER,
  DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS,
  DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES,
  DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER,
  runDataCorrectionGovernanceAction,
  runDataCorrectionGovernanceActionAsync,
};
