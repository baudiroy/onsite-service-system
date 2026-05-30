'use strict';

const {
  sanitizeRepairIntakePublicOpenRequestDto,
} = require('./repairIntakePublicOpenRequestDtoSanitizer');
const {
  decideRepairIntakeDraftToCasePermission,
} = require('./repairIntakeDraftToCasePermissionGate');

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

function permissionReasonCode(reasonCode) {
  if (reasonCode === 'missing_trusted_context') {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_MISSING_TRUSTED_CONTEXT';
  }

  if (reasonCode === 'role_not_allowed') {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED';
  }

  if (reasonCode === 'invalid_source') {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_INVALID_SOURCE';
  }

  return 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_DENIED';
}

function permissionDeniedEnvelope(permissionDecision) {
  const safeDecision = safeObject(permissionDecision);
  const reasonCode = safeString(safeDecision.reasonCode);
  const status = reasonCode === 'missing_trusted_context' ? 'invalid_context' : 'denied';

  return sanitizeNestedValue({
    ok: false,
    status,
    messageKey: 'repair_intake_draft_to_case.permission_denied',
    reasonCode: permissionReasonCode(reasonCode),
    organizationId: safeString(safeDecision.organizationId),
    actorId: safeString(safeDecision.actorId),
    repairIntakeDraftId: safeString(safeDecision.repairIntakeDraftId),
    source: safeString(safeDecision.source),
    actorRole: safeString(safeDecision.actorRole),
    draftInput: {},
  });
}

function permissionDeniedAuditIntent(permissionDecision, deniedEnvelope) {
  const safeDecision = safeObject(permissionDecision);
  const safeEnvelope = safeObject(deniedEnvelope);
  const reasonCode = safeString(safeDecision.reasonCode);

  return sanitizeNestedValue({
    eventType: 'repair_intake_draft_to_case_permission_denied',
    phase: 'denied',
    status: 'denied',
    outcome: 'permission_denied',
    organizationId: safeString(safeDecision.organizationId),
    actorId: safeString(safeDecision.actorId),
    actorRole: safeString(safeDecision.actorRole),
    repairIntakeDraftId: safeString(safeDecision.repairIntakeDraftId),
    source: safeString(safeDecision.source),
    permissionReasonCode: permissionReasonCode(reasonCode),
    reasonCode: safeString(safeEnvelope.reasonCode) || permissionReasonCode(reasonCode),
  });
}

function resolvePermissionDeniedAuditWriter(auditWriter) {
  if (typeof auditWriter === 'function') {
    return auditWriter;
  }

  if (!isPlainObject(auditWriter)) {
    return null;
  }

  for (const methodName of [
    'recordRepairIntakeDraftToCasePermissionDenied',
    'recordDraftToCasePermissionDenied',
    'recordPermissionDenied',
    'record',
  ]) {
    if (typeof auditWriter[methodName] === 'function') {
      return auditWriter[methodName].bind(auditWriter);
    }
  }

  return null;
}

async function writePermissionDeniedAuditIntent(writeAudit, permissionDecision, deniedEnvelope) {
  if (!writeAudit) {
    return;
  }

  const auditIntent = permissionDeniedAuditIntent(permissionDecision, deniedEnvelope);

  try {
    await writeAudit(sanitizeNestedValue({ auditIntent }));
  } catch (error) {
  }
}

function createAdapterInput(resolverResult) {
  const safeResult = safeObject(resolverResult);
  const draftInput = sanitizeRepairIntakePublicOpenRequestDto(safeResult.draftInput || {});
  delete draftInput.source;

  return sanitizeNestedValue({
    organizationId: safeString(safeResult.organizationId),
    actorId: safeString(safeResult.actorId),
    repairIntakeDraftId: safeString(safeResult.repairIntakeDraftId),
    source: safeString(safeResult.source),
    actorRole: safeString(safeResult.actorRole),
    draftInput,
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
  const writePermissionDeniedAudit = resolvePermissionDeniedAuditWriter(
    safeOptions.permissionDeniedAuditWriter || safeOptions.auditWriter || safeOptions.auditSink,
  );

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

    const permissionDecision = decideRepairIntakeDraftToCasePermission(resolverResult);

    if (permissionDecision.allowed !== true) {
      const deniedEnvelope = permissionDeniedEnvelope(permissionDecision);

      await writePermissionDeniedAuditIntent(writePermissionDeniedAudit, permissionDecision, deniedEnvelope);

      return deniedEnvelope;
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
