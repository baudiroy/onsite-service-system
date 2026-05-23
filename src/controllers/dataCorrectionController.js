'use strict';

const {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
  DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES,
  DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER,
  runDataCorrectionGovernanceAction,
  runDataCorrectionGovernanceActionAsync,
} = require('../dataCorrection/dataCorrectionGovernanceOrchestrator');

const DATA_CORRECTION_CONTROLLER_STATUS_CODES = Object.freeze({
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  OK: 200,
});

const DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS = Object.freeze({
  BAD_REQUEST: 'dataCorrection.badRequest',
  FORBIDDEN: 'dataCorrection.forbidden',
});

const DATA_CORRECTION_CONTROLLER_DECISIONS = Object.freeze({
  SAFE_DENY: 'safe_deny',
});

const DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS = Object.freeze({
  FORBIDDEN_KEY: Object.freeze(/phone|lineuserid|line_user_id|linechannelid|line_channel_id|token|secret|password|database_url|db_url|postgres_url|internalnote|auditraw|airaw|rawpayload|finalappointmentid/i),
  SENSITIVE_STRING: Object.freeze(/raw_phone|raw_address|line_user|lineuserid|token|secret|password|database_url|db_url|postgres_url|internal_note|audit_raw|ai_raw|final_appointment|writer_failure/i),
});

const DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS = Object.freeze({
  DATA_CORRECTION_REQUEST: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
  FOLLOW_UP_PROPOSAL: DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
  POST_DEPARTURE_FREEZE: DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
  PRE_DEPARTURE_APPLY: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
  UNABLE_TO_COMPLETE_RESULT: DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
});

const DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER = Object.freeze(
  [...DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER],
);

const DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS = Object.freeze([
  'body.actionType',
  'body.payload.actionType',
]);

const DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS = Object.freeze({
  AUTH: 'auth',
  PERMISSION_CONTEXT: 'dataCorrectionPermissionContext',
});

const DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS = Object.freeze({
  APPOINTMENT_RESULT_WRITER: 'appointmentResultWriter',
  AUDIT_WRITER: 'auditWriter',
  CONTACT_LOG_WRITER: 'contactLogWriter',
  CORRECTION_WRITER: 'correctionWriter',
  DISPATCH_NOTE_WRITER: 'dispatchNoteWriter',
  ENGINEER_NOTIFICATION_WRITER: 'engineerNotificationWriter',
  EVIDENCE_WRITER: 'evidenceWriter',
  FOLLOW_UP_DRAFT_WRITER: 'followUpDraftWriter',
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isForbiddenKey(key) {
  if (key === 'phoneReverificationRequired') {
    return false;
  }

  return DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.FORBIDDEN_KEY.test(String(key));
}

function looksSensitiveString(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.SENSITIVE_STRING.test(value);
}

function sanitizeResponse(value) {
  if (Array.isArray(value)) {
    return value
      .map(sanitizeResponse)
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const sanitized = {};

    for (const [key, childValue] of Object.entries(value)) {
      if (isForbiddenKey(key)) {
        continue;
      }

      const safeValue = sanitizeResponse(childValue);

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

function forbiddenResponse() {
  return {
    statusCode: DATA_CORRECTION_CONTROLLER_STATUS_CODES.FORBIDDEN,
    body: {
      status: DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY,
      decision: DATA_CORRECTION_CONTROLLER_DECISIONS.SAFE_DENY,
      safeMessageKey: DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS.FORBIDDEN,
    },
  };
}

function malformedResponse() {
  return {
    statusCode: DATA_CORRECTION_CONTROLLER_STATUS_CODES.BAD_REQUEST,
    body: {
      status: DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY,
      decision: DATA_CORRECTION_CONTROLLER_DECISIONS.SAFE_DENY,
      safeMessageKey: DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS.BAD_REQUEST,
    },
  };
}

function buildGovernanceInput(req) {
  const body = isPlainObject(req.body) ? req.body : {};
  const auth = resolveGovernanceAuth(req);
  const payload = isPlainObject(body.payload) ? body.payload : {};
  const actorPermissions = Array.isArray(auth.permissions) ? auth.permissions.slice() : [];

  return {
    actionType: safeString(body.actionType || payload.actionType),
    payload: {
      ...payload,
      organizationId: safeString(auth.organizationId),
      actor: {
        userId: safeString(auth.userId),
        role: safeString(auth.role),
        permissions: actorPermissions,
      },
    },
  };
}

function normalizeActionType(value) {
  return String(value || '').trim().toLowerCase();
}

function actionSourceValueFor(path, body, payload) {
  if (path === 'body.actionType') {
    return body.actionType;
  }

  if (path === 'body.payload.actionType') {
    return payload.actionType;
  }

  return undefined;
}

function resolveRequestActionType(req) {
  const body = isPlainObject(req && req.body) ? req.body : {};
  const payload = isPlainObject(body.payload) ? body.payload : {};
  const actionSourceValues = DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS.map((path) => (
    actionSourceValueFor(path, body, payload)
  ));

  return normalizeActionType(actionSourceValues[0] || actionSourceValues[1]);
}

function resolveGovernanceAuth(req) {
  const request = isPlainObject(req) ? req : {};
  const permissionContext = isPlainObject(request[DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS.PERMISSION_CONTEXT])
    ? request[DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS.PERMISSION_CONTEXT]
    : {};

  if (
    permissionContext.organizationId
    || permissionContext.userId
    || permissionContext.role
  ) {
    return permissionContext;
  }

  return isPlainObject(request[DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS.AUTH])
    ? request[DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS.AUTH]
    : {};
}

function isAllowedByPermissionContext(req, actionType) {
  const request = isPlainObject(req) ? req : {};
  const permissionContext = isPlainObject(request[DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS.PERMISSION_CONTEXT])
    ? request[DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS.PERMISSION_CONTEXT]
    : null;

  if (!permissionContext || !Array.isArray(permissionContext.allowedActionTypes)) {
    return true;
  }

  return permissionContext.allowedActionTypes
    .map(normalizeActionType)
    .includes(normalizeActionType(actionType));
}

function buildDataCorrectionGovernanceResponse(req, options = {}) {
  const request = isPlainObject(req) ? req : null;

  if (!request || (request.body !== undefined && !isPlainObject(request.body))) {
    return malformedResponse();
  }

  const auth = resolveGovernanceAuth(request);

  if (!auth.organizationId || !auth.userId || !auth.role) {
    return forbiddenResponse();
  }

  if (!isAllowedByPermissionContext(request, resolveRequestActionType(request))) {
    return forbiddenResponse();
  }

  try {
    const envelope = runDataCorrectionGovernanceAction(buildGovernanceInput(request), options);
    const safeEnvelope = sanitizeResponse(envelope);

    if (!safeEnvelope || safeEnvelope.status === DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY) {
      return {
        statusCode: DATA_CORRECTION_CONTROLLER_STATUS_CODES.FORBIDDEN,
        body: {
          status: DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY,
          decision: safeEnvelope && safeEnvelope.decision ? safeEnvelope.decision : DATA_CORRECTION_CONTROLLER_DECISIONS.SAFE_DENY,
          safeMessageKey: DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS.FORBIDDEN,
          phoneReverificationRequired: Boolean(safeEnvelope && safeEnvelope.result && safeEnvelope.result.phoneReverificationRequired),
        },
      };
    }

    return {
      statusCode: DATA_CORRECTION_CONTROLLER_STATUS_CODES.OK,
      body: safeEnvelope,
    };
  } catch (error) {
    return malformedResponse();
  }
}

async function buildDataCorrectionGovernanceResponseAsync(req, options = {}) {
  const request = isPlainObject(req) ? req : null;

  if (!request || (request.body !== undefined && !isPlainObject(request.body))) {
    return malformedResponse();
  }

  const auth = resolveGovernanceAuth(request);

  if (!auth.organizationId || !auth.userId || !auth.role) {
    return forbiddenResponse();
  }

  if (!isAllowedByPermissionContext(request, resolveRequestActionType(request))) {
    return forbiddenResponse();
  }

  try {
    const envelope = await runDataCorrectionGovernanceActionAsync(
      buildGovernanceInput(request),
      options,
    );
    const safeEnvelope = sanitizeResponse(envelope);

    if (!safeEnvelope || safeEnvelope.status === DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY) {
      return {
        statusCode: DATA_CORRECTION_CONTROLLER_STATUS_CODES.FORBIDDEN,
        body: {
          status: DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY,
          decision: safeEnvelope && safeEnvelope.decision ? safeEnvelope.decision : DATA_CORRECTION_CONTROLLER_DECISIONS.SAFE_DENY,
          safeMessageKey: DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS.FORBIDDEN,
          phoneReverificationRequired: Boolean(safeEnvelope && safeEnvelope.result && safeEnvelope.result.phoneReverificationRequired),
        },
      };
    }

    return {
      statusCode: DATA_CORRECTION_CONTROLLER_STATUS_CODES.OK,
      body: safeEnvelope,
    };
  } catch (error) {
    return malformedResponse();
  }
}

function isAsyncFunction(value) {
  return Boolean(value) && value.constructor && value.constructor.name === 'AsyncFunction';
}

function resolveCorrectionWriter(options = {}) {
  const source = isPlainObject(options) ? options : {};

  return source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.CORRECTION_WRITER];
}

function isAsyncWriter(writer) {
  return (
    isAsyncFunction(writer)
    || (isPlainObject(writer) && isAsyncFunction(writer.write))
  );
}

function hasAsyncPostDepartureWriter(options = {}) {
  const source = isPlainObject(options) ? options : {};

  return [
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.AUDIT_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.CONTACT_LOG_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.DISPATCH_NOTE_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.ENGINEER_NOTIFICATION_WRITER],
  ].some(isAsyncWriter);
}

function hasAsyncRequestWriter(options = {}) {
  const source = isPlainObject(options) ? options : {};

  return [
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.AUDIT_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.CONTACT_LOG_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.DISPATCH_NOTE_WRITER],
  ].some(isAsyncWriter);
}

function hasAsyncUnableToCompleteWriter(options = {}) {
  const source = isPlainObject(options) ? options : {};

  return [
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.APPOINTMENT_RESULT_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.EVIDENCE_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.AUDIT_WRITER],
  ].some(isAsyncWriter);
}

function hasAsyncFollowUpWriter(options = {}) {
  const source = isPlainObject(options) ? options : {};

  return [
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.FOLLOW_UP_DRAFT_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.DISPATCH_NOTE_WRITER],
    source[DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.AUDIT_WRITER],
  ].some(isAsyncWriter);
}

function shouldUseAsyncGovernanceHandler(req, options = {}) {
  const writer = resolveCorrectionWriter(options);
  const actionType = resolveRequestActionType(req);

  if (actionType === DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS.DATA_CORRECTION_REQUEST) {
    return hasAsyncRequestWriter(options);
  }

  if (actionType === DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS.PRE_DEPARTURE_APPLY) {
    return isAsyncWriter(writer);
  }

  if (actionType === DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS.POST_DEPARTURE_FREEZE) {
    return hasAsyncPostDepartureWriter(options);
  }

  if (actionType === DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS.UNABLE_TO_COMPLETE_RESULT) {
    return hasAsyncUnableToCompleteWriter(options);
  }

  if (actionType === DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS.FOLLOW_UP_PROPOSAL) {
    return hasAsyncFollowUpWriter(options);
  }

  return false;
}

function handleDataCorrectionGovernanceRequest(req, res, options = {}) {
  const response = buildDataCorrectionGovernanceResponse(req, options);

  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    return response;
  }

  return res.status(response.statusCode).json(response.body);
}

async function handleDataCorrectionGovernanceRequestAsync(req, res, options = {}) {
  const response = await buildDataCorrectionGovernanceResponseAsync(req, options);

  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    return response;
  }

  return res.status(response.statusCode).json(response.body);
}

function createDataCorrectionGovernanceHandler(options = {}) {
  return function dataCorrectionGovernanceHandler(req, res) {
    if (shouldUseAsyncGovernanceHandler(req, options)) {
      return handleDataCorrectionGovernanceRequestAsync(req, res, options);
    }

    return handleDataCorrectionGovernanceRequest(req, res, options);
  };
}

module.exports = {
  DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS,
  DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS,
  DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER,
  DATA_CORRECTION_CONTROLLER_DECISIONS,
  DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS,
  DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS,
  DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS,
  DATA_CORRECTION_CONTROLLER_STATUS_CODES,
  DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS,
  buildDataCorrectionGovernanceResponse,
  buildDataCorrectionGovernanceResponseAsync,
  createDataCorrectionGovernanceHandler,
  handleDataCorrectionGovernanceRequest,
  handleDataCorrectionGovernanceRequestAsync,
};
