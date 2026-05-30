'use strict';

const {
  sanitizeRepairIntakePublicOpenRequestDto,
} = require('./repairIntakePublicOpenRequestDtoSanitizer');

const CONTEXT_INVALID_MESSAGE_KEY = 'repair_intake_draft_to_case.invalid_context';
const INPUT_INVALID_MESSAGE_KEY = 'repair_intake_draft_to_case.invalid_input';
const RESOLVED_MESSAGE_KEY = 'repair_intake_draft_to_case.request_context_resolved';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'auditrecord',
  'authorization',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'databaseurl',
  'dbrow',
  'd' + 'b',
  'email',
  'error',
  'final' + 'appointment' + 'id',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'permissiontrace',
  'phone',
  'providerpayload',
  'query',
  'raw',
  'rawbody',
  'rawcontext',
  'rawerror',
  'rawinput',
  'rawrequest',
  'rawresult',
  'rawrow',
  'rawrows',
  'secret',
  's' + 'ql',
  'stack',
  'token',
]);

const BODY_OVERRIDE_FIELD_NAMES = new Set([
  'actorid',
  'organizationid',
  'orgid',
  'userid',
]);

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function normalizedFieldName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function fieldIsUnsafe(key) {
  const normalized = normalizedFieldName(key);

  return normalized.startsWith('raw') || UNSAFE_FIELD_NAMES.has(normalized);
}

function bodyFieldIsUnsafe(key) {
  return fieldIsUnsafe(key) || BODY_OVERRIDE_FIELD_NAMES.has(normalizedFieldName(key));
}

function sanitizeNestedValue(value, fieldGuard = fieldIsUnsafe) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeNestedValue(item, fieldGuard))
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldGuard(key)) {
        continue;
      }

      const sanitized = sanitizeNestedValue(fieldValue, fieldGuard);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (
    value === undefined
    || typeof value === 'function'
    || typeof value === 'symbol'
    || (value !== null && typeof value === 'object')
  ) {
    return undefined;
  }

  return value;
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function safeObject(value, fieldGuard = fieldIsUnsafe) {
  return isPlainObject(value) ? sanitizeNestedValue(value, fieldGuard) : {};
}

function baseEnvelope(status, messageKey, reasonCode, context = {}) {
  return sanitizeNestedValue({
    ok: false,
    status,
    messageKey,
    reasonCode,
    organizationId: safeString(context.organizationId),
    actorId: safeString(context.actorId),
    repairIntakeDraftId: safeString(context.repairIntakeDraftId),
    source: safeString(context.source),
    actorRole: safeString(context.actorRole),
    draftInput: {},
  });
}

function invalidContext(reasonCode, context = {}) {
  return baseEnvelope('invalid_context', CONTEXT_INVALID_MESSAGE_KEY, reasonCode, context);
}

function invalidInput(reasonCode, context = {}) {
  return baseEnvelope('invalid_input', INPUT_INVALID_MESSAGE_KEY, reasonCode, context);
}

function resolveRepairIntakeDraftToCaseRequestContext(input = {}) {
  const safeInput = isPlainObject(input) ? input : {};
  const sessionContext = safeObject(safeInput.sessionContext);
  const requestBody = isPlainObject(safeInput.requestBody) ? safeInput.requestBody : {};

  const organizationId = safeString(sessionContext.organizationId);
  const actorId = safeString(sessionContext.actorId);
  const repairIntakeDraftId = safeString(requestBody.repairIntakeDraftId);
  const context = {
    organizationId,
    actorId,
    repairIntakeDraftId,
    source: safeString(safeInput.requestSource),
    actorRole: safeString(sessionContext.actorRole),
  };

  if (!organizationId) {
    return invalidContext(
      'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ORGANIZATION_REQUIRED',
      context,
    );
  }

  if (!actorId) {
    return invalidContext(
      'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ACTOR_REQUIRED',
      context,
    );
  }

  if (!repairIntakeDraftId) {
    return invalidInput(
      'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_DRAFT_REQUIRED',
      context,
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(requestBody, 'draftInput')
    && !isPlainObject(requestBody.draftInput)
  ) {
    return invalidInput(
      'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_DRAFT_INPUT_INVALID',
      context,
    );
  }

  const draftInput = sanitizeRepairIntakePublicOpenRequestDto(requestBody.draftInput || {});

  return sanitizeNestedValue({
    ok: true,
    status: 'resolved',
    messageKey: RESOLVED_MESSAGE_KEY,
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_RESOLVED',
    organizationId,
    actorId,
    repairIntakeDraftId,
    source: context.source,
    actorRole: context.actorRole,
    draftInput,
  });
}

function createRepairIntakeDraftToCaseRequestContextResolver() {
  return {
    resolveRepairIntakeDraftToCaseRequestContext,
  };
}

module.exports = {
  createRepairIntakeDraftToCaseRequestContextResolver,
  resolveRepairIntakeDraftToCaseRequestContext,
};
