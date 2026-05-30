'use strict';

const {
  sanitizeRepairIntakePublicOpenRequestDto,
} = require('./repairIntakePublicOpenRequestDtoSanitizer');

const UNAVAILABLE_MESSAGE_KEY = 'repair_intake_draft_to_case.synthetic_handler_unavailable';
const INVALID_MESSAGE_KEY = 'repair_intake_draft_to_case.synthetic_handler_invalid';

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
  'params',
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

function sanitizeNestedValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeNestedValue(item))
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeNestedValue(fieldValue);

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

function safeObject(value) {
  return isPlainObject(value) ? sanitizeNestedValue(value) : {};
}

function dependencyEnvelope(reasonCode) {
  return {
    ok: false,
    status: 'invalid_dependency',
    messageKey: UNAVAILABLE_MESSAGE_KEY,
    reasonCode,
    organizationId: null,
    actorId: null,
    repairIntakeDraftId: null,
    source: null,
    actorRole: null,
    draftInput: {},
  };
}

function failureEnvelope(reasonCode, context = {}) {
  const safeContext = safeObject(context);

  return sanitizeNestedValue({
    ok: false,
    status: 'failed',
    messageKey: UNAVAILABLE_MESSAGE_KEY,
    reasonCode,
    organizationId: safeString(safeContext.organizationId),
    actorId: safeString(safeContext.actorId),
    repairIntakeDraftId: safeString(safeContext.repairIntakeDraftId),
    source: safeString(safeContext.source),
    actorRole: safeString(safeContext.actorRole),
    draftInput: {},
  });
}

function normalizeResolverInvalidResult(resolverResult) {
  const safeResult = safeObject(resolverResult);
  const status = safeString(safeResult.status) || 'invalid_context';

  return sanitizeNestedValue({
    ok: false,
    status,
    messageKey: safeString(safeResult.messageKey) || INVALID_MESSAGE_KEY,
    reasonCode: safeString(safeResult.reasonCode)
      || 'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTEXT_INVALID',
    organizationId: safeString(safeResult.organizationId),
    actorId: safeString(safeResult.actorId),
    repairIntakeDraftId: safeString(safeResult.repairIntakeDraftId),
    source: safeString(safeResult.source),
    actorRole: safeString(safeResult.actorRole),
    draftInput: {},
  });
}

function createAdapterInput(resolverResult) {
  const safeResult = safeObject(resolverResult);

  return sanitizeNestedValue({
    organizationId: safeString(safeResult.organizationId),
    actorId: safeString(safeResult.actorId),
    repairIntakeDraftId: safeString(safeResult.repairIntakeDraftId),
    source: safeString(safeResult.source),
    actorRole: safeString(safeResult.actorRole),
    draftInput: sanitizeRepairIntakePublicOpenRequestDto(safeResult.draftInput || {}),
  });
}

function resolveContextResolver(requestContextResolver) {
  if (typeof requestContextResolver === 'function') {
    return requestContextResolver;
  }

  if (
    isPlainObject(requestContextResolver)
    && typeof requestContextResolver.resolveRepairIntakeDraftToCaseRequestContext === 'function'
  ) {
    return requestContextResolver.resolveRepairIntakeDraftToCaseRequestContext.bind(requestContextResolver);
  }

  return null;
}

function resolveControllerAdapter(controllerAdapter) {
  if (!isPlainObject(controllerAdapter)) {
    return null;
  }

  if (typeof controllerAdapter.handleDraftToCase === 'function') {
    return controllerAdapter.handleDraftToCase.bind(controllerAdapter);
  }

  if (typeof controllerAdapter.submitDraftToCase === 'function') {
    return controllerAdapter.submitDraftToCase.bind(controllerAdapter);
  }

  return null;
}

function createInvalidSyntheticHandler(reasonCode) {
  async function handleDraftToCase() {
    return dependencyEnvelope(reasonCode);
  }

  return {
    handleDraftToCase,
  };
}

function createRepairIntakeDraftToCaseSyntheticHandler(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const resolveRequestContext = resolveContextResolver(safeOptions.requestContextResolver);
  const callControllerAdapter = resolveControllerAdapter(safeOptions.controllerAdapter);

  if (!resolveRequestContext) {
    return createInvalidSyntheticHandler(
      'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTEXT_RESOLVER_REQUIRED',
    );
  }

  if (!callControllerAdapter) {
    return createInvalidSyntheticHandler(
      'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_REQUIRED',
    );
  }

  async function handleDraftToCase(handlerInput = {}) {
    let resolverResult;

    try {
      resolverResult = await resolveRequestContext(isPlainObject(handlerInput) ? handlerInput : {});
    } catch (error) {
      return failureEnvelope(
        'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTEXT_RESOLVER_FAILED',
      );
    }

    if (!isPlainObject(resolverResult) || resolverResult.ok !== true) {
      return normalizeResolverInvalidResult(resolverResult);
    }

    const adapterInput = createAdapterInput(resolverResult);

    try {
      return sanitizeNestedValue(await callControllerAdapter(adapterInput));
    } catch (error) {
      return failureEnvelope(
        'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED',
        adapterInput,
      );
    }
  }

  return {
    handleDraftToCase,
  };
}

module.exports = {
  createRepairIntakeDraftToCaseSyntheticHandler,
};
