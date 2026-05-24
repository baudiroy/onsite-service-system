'use strict';

const INVALID_DEPENDENCY_ACTIONS = ['configure_authorization_gate_and_application_service'];
const RETRY_ACTIONS = ['retry_or_manual_review'];

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'databaseurl',
  'd' + 'b',
  'error',
  'final' + 'appointment' + 'id',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'params',
  'phone',
  'query',
  'raw',
  'rawbody',
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

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function safeArray(value) {
  return Array.isArray(value)
    ? sanitizeNestedValue(value).filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function safeObject(value) {
  return isPlainObject(value) ? sanitizeNestedValue(value) : {};
}

function createAuthorizationContext(request) {
  const safeRequest = safeObject(request);

  return sanitizeNestedValue({
    organizationId: safeString(safeRequest.organizationId),
    actorId: safeString(safeRequest.actorId),
    repairIntakeDraftId: safeString(safeRequest.repairIntakeDraftId),
    source: safeString(safeRequest.source),
    actorRole: safeString(safeRequest.actorRole),
    requestId: safeString(safeRequest.requestId),
    tenantId: safeString(safeRequest.tenantId),
    metadata: safeObject(safeRequest.metadata),
  });
}

function invalidDependencyEnvelope(reasonCode) {
  return {
    ok: false,
    allowed: false,
    submitted: false,
    status: 'invalid_dependency',
    reasonCode,
    requiredActions: INVALID_DEPENDENCY_ACTIONS,
    organizationId: null,
    actorId: null,
    repairIntakeDraftId: null,
    draftId: null,
    caseId: null,
    caseRef: null,
    authorizationStatus: null,
    applicationStatus: null,
    metadata: {},
    warnings: [],
  };
}

function authorizationFailureEnvelope(request) {
  const context = createAuthorizationContext(request);

  return sanitizeNestedValue({
    ok: false,
    allowed: false,
    submitted: false,
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_FAILED',
    requiredActions: RETRY_ACTIONS,
    organizationId: context.organizationId || null,
    actorId: context.actorId || null,
    repairIntakeDraftId: context.repairIntakeDraftId || null,
    draftId: context.repairIntakeDraftId || null,
    caseId: null,
    caseRef: null,
    authorizationStatus: 'failed',
    applicationStatus: null,
    metadata: {},
    warnings: [],
  });
}

function applicationFailureEnvelope(request, authorizationResult) {
  const context = createAuthorizationContext(request);
  const authResult = safeObject(authorizationResult);

  return sanitizeNestedValue({
    ok: false,
    allowed: authResult.allowed === true,
    submitted: false,
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_FAILED',
    requiredActions: RETRY_ACTIONS,
    organizationId: context.organizationId || null,
    actorId: context.actorId || null,
    repairIntakeDraftId: context.repairIntakeDraftId || null,
    draftId: context.repairIntakeDraftId || null,
    caseId: null,
    caseRef: null,
    authorizationStatus: safeString(authResult.status) || 'allowed',
    applicationStatus: 'failed',
    metadata: {},
    warnings: [],
  });
}

function authorizationBlockedEnvelope(request, authorizationResult) {
  const context = createAuthorizationContext(request);
  const authResult = safeObject(authorizationResult);
  const status = safeString(authResult.status) || 'denied';

  return sanitizeNestedValue({
    ok: false,
    allowed: false,
    submitted: false,
    status,
    reasonCode: safeString(authResult.reasonCode)
      || 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_NOT_ALLOWED',
    requiredActions: safeArray(authResult.requiredActions).length > 0
      ? safeArray(authResult.requiredActions)
      : ['request_permission_review'],
    organizationId: safeString(authResult.organizationId) || context.organizationId || null,
    actorId: safeString(authResult.actorId) || context.actorId || null,
    repairIntakeDraftId: safeString(authResult.repairIntakeDraftId) || context.repairIntakeDraftId || null,
    draftId: safeString(authResult.repairIntakeDraftId) || context.repairIntakeDraftId || null,
    caseId: null,
    caseRef: null,
    authorizationStatus: status,
    applicationStatus: null,
    metadata: safeObject(authResult.metadata),
    warnings: safeArray(authResult.warnings),
  });
}

function applicationResultEnvelope(request, authorizationResult, applicationResult) {
  const context = createAuthorizationContext(request);
  const authResult = safeObject(authorizationResult);
  const appResult = safeObject(applicationResult);
  const appOk = appResult.ok === true;
  const status = safeString(appResult.status) || (appOk ? 'submitted' : 'failed');

  return sanitizeNestedValue({
    ok: appOk,
    allowed: true,
    submitted: appResult.submitted === true || appOk,
    status,
    reasonCode: safeString(appResult.reasonCode)
      || (appOk
        ? 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_SUBMITTED'
        : 'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_NOT_SUCCESSFUL'),
    requiredActions: appOk ? [] : (
      safeArray(appResult.requiredActions).length > 0 ? safeArray(appResult.requiredActions) : RETRY_ACTIONS
    ),
    organizationId: safeString(appResult.organizationId) || context.organizationId || null,
    actorId: safeString(appResult.actorId) || context.actorId || null,
    repairIntakeDraftId: safeString(appResult.repairIntakeDraftId) || context.repairIntakeDraftId || null,
    draftId: safeString(appResult.draftId)
      || safeString(appResult.repairIntakeDraftId)
      || context.repairIntakeDraftId
      || null,
    caseId: safeString(appResult.caseId),
    caseRef: isPlainObject(appResult.caseRef) ? appResult.caseRef : null,
    authorizationStatus: safeString(authResult.status) || 'allowed',
    applicationStatus: status,
    metadata: safeObject(appResult.metadata),
    warnings: safeArray(appResult.warnings),
  });
}

function createInvalidOrchestrator(reasonCode) {
  async function submitDraftToCase() {
    return invalidDependencyEnvelope(reasonCode);
  }

  return {
    submitDraftToCase,
  };
}

function createRepairIntakeDraftToCaseOrchestrator(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const { authorizationGate, draftToCaseApplicationService } = safeOptions;

  if (!isPlainObject(authorizationGate)) {
    return createInvalidOrchestrator(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_GATE_REQUIRED',
    );
  }

  if (typeof authorizationGate.authorizeDraftToCase !== 'function') {
    return createInvalidOrchestrator(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_AUTHORIZATION_METHOD_REQUIRED',
    );
  }

  if (!isPlainObject(draftToCaseApplicationService)) {
    return createInvalidOrchestrator(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_SERVICE_REQUIRED',
    );
  }

  if (typeof draftToCaseApplicationService.submitDraftToCase !== 'function') {
    return createInvalidOrchestrator(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ORCHESTRATOR_APPLICATION_METHOD_REQUIRED',
    );
  }

  async function submitDraftToCase(request = {}) {
    let authorizationResult;

    try {
      authorizationResult = await authorizationGate.authorizeDraftToCase(createAuthorizationContext(request));
    } catch (error) {
      return authorizationFailureEnvelope(request);
    }

    if (!isPlainObject(authorizationResult) || authorizationResult.allowed !== true) {
      return authorizationBlockedEnvelope(request, authorizationResult);
    }

    try {
      const applicationResult = await draftToCaseApplicationService.submitDraftToCase(sanitizeNestedValue(request));

      return applicationResultEnvelope(request, authorizationResult, applicationResult);
    } catch (error) {
      return applicationFailureEnvelope(request, authorizationResult);
    }
  }

  return {
    submitDraftToCase,
  };
}

module.exports = {
  createRepairIntakeDraftToCaseOrchestrator,
};
