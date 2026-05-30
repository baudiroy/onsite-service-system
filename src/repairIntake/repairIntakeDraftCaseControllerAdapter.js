'use strict';

const FORBIDDEN_RESPONSE_FIELDS = new Set([
  'address',
  'auditInternal',
  'audit_internal',
  'authorization',
  'billing',
  'caseId',
  'case_id',
  'cookie',
  'cookies',
  'customer',
  'customerAddress',
  'customerData',
  'customerName',
  'customerPayload',
  'customerPhone',
  'database_url',
  'databaseUrl',
  'db',
  'debug',
  'error',
  'finalAppointmentId',
  'final_appointment_id',
  'fullAddress',
  'headers',
  'internal',
  'invoice',
  'lineAccessToken',
  'lineUserId',
  'phone',
  'phoneNumber',
  'providerPayload',
  'rag',
  'raw',
  'rawAddress',
  'rawBody',
  'rawCustomerPayload',
  'rawDraft',
  'rawDraftInput',
  'rawError',
  'rawInput',
  'rawImportedRow',
  'rawImportedRowPayload',
  'rawPayload',
  'rawPortOutput',
  'rows',
  'secret',
  'settlement',
  'sql',
  'stack',
  'stackTrace',
  'token',
  'tokenSecret',
]);
const UNSAFE_TEXT_MARKERS = [
  'audit internal',
  'audit_internal',
  'auditinternal',
  'billing',
  'customer address',
  'customer phone',
  'customer private',
  'customeraddress',
  'customerphone',
  'database_url',
  'debug detail',
  'invoice',
  'line access token',
  'lineaccesstoken',
  'password',
  'postgres://',
  'postgresql://',
  'process.env',
  'provider payload',
  'providerpayload',
  'rag',
  'raw body',
  'raw draft',
  'raw error',
  'raw request',
  'rawbody',
  'rawdraft',
  'rawerror',
  'rawrequest',
  'secret',
  'select *',
  'settlement',
  'stack trace',
  'token',
];

class RepairIntakeDraftCaseControllerAdapterError extends Error {
  constructor(reasonCode, requiredActions = ['configure_application_service']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftCaseControllerAdapterError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || stringHasUnsafeText(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function safeArray(value) {
  return Array.isArray(value)
    ? value.map((item) => stringValue(item)).filter(Boolean)
    : [];
}

function fieldIsForbidden(key) {
  return FORBIDDEN_RESPONSE_FIELDS.has(key)
    || FORBIDDEN_RESPONSE_FIELDS.has(String(key).toLowerCase());
}

function stringHasUnsafeText(value) {
  const normalized = value.toLowerCase();

  return UNSAFE_TEXT_MARKERS.some((marker) => normalized.includes(marker));
}

function sanitizeTopLevelEnvelopeSource(value) {
  if (!isObject(value)) {
    return {};
  }

  const result = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (!fieldIsForbidden(key)) {
      result[key] = fieldValue;
    }
  }

  return result;
}

function sanitizeBoolean(value) {
  return value === true;
}

function sanitizeContext(value) {
  return isObject(value) ? value : {};
}

function sanitizeBody(value) {
  return isObject(value) ? value : {};
}

function sanitizeParams(value) {
  return isObject(value) ? value : {};
}

function sanitizeRequestInput(requestLike = {}) {
  const source = isObject(requestLike) ? requestLike : {};
  const params = sanitizeParams(source.params);
  const body = sanitizeBody(source.body);
  const context = sanitizeContext(source.context);
  const approvalContext = sanitizeContext(body.approvalContext);
  const permissionContext = sanitizeContext(body.permissionContext);

  return {
    draftId: stringValue(params.draftId),
    organizationId: stringValue(context.organizationId) || stringValue(body.organizationId),
    actorId: stringValue(context.actorId),
    requestId: stringValue(context.requestId),
    idempotencyKey: stringValue(source.idempotencyKey) || stringValue(body.idempotencyKey),
    approvalContext: {
      accepted: sanitizeBoolean(approvalContext.accepted),
      approvalId: stringValue(approvalContext.approvalId),
      acceptedByActorId: stringValue(approvalContext.acceptedByActorId),
    },
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: sanitizeBoolean(permissionContext.canCreateCaseFromRepairIntakeDraft),
      permissionSource: stringValue(permissionContext.permissionSource),
    },
  };
}

function sanitizeRef(value) {
  if (!isObject(value)) {
    return null;
  }

  const result = {};

  for (const key of [
    'id',
    'refId',
    'referenceId',
    'type',
    'role',
    'source',
    'sourceRef',
    'externalRef',
    'reviewStatus',
  ]) {
    const refValue = stringValue(value[key]);

    if (refValue) {
      result[key] = refValue;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function sanitizeCaseRef(value) {
  if (!isObject(value)) {
    return null;
  }

  const id = stringValue(value.id);
  const organizationId = stringValue(value.organizationId || value.organization_id);
  const sourceDraftId = stringValue(value.sourceDraftId || value.source_draft_id);
  const status = stringValue(value.status);

  if (!id || !organizationId || !sourceDraftId || !status) {
    return null;
  }

  return {
    id,
    organizationId,
    sourceDraftId,
    status,
  };
}

function sanitizeCaseCandidate(value) {
  if (!isObject(value)) {
    return null;
  }

  const sourceDraftId = stringValue(value.sourceDraftId);
  const organizationId = stringValue(value.organizationId);
  const intakeSource = stringValue(value.intakeSource);

  if (!sourceDraftId || !organizationId || !intakeSource) {
    return null;
  }

  return {
    sourceDraftId,
    organizationId,
    brandId: stringValue(value.brandId) || null,
    serviceProviderId: stringValue(value.serviceProviderId) || null,
    intakeSource,
    serviceType: stringValue(value.serviceType) || null,
    priority: stringValue(value.priority) || null,
    reporterRef: sanitizeRef(value.reporterRef),
    customerRef: sanitizeRef(value.customerRef),
    billingContactRef: sanitizeRef(value.billingContactRef),
    siteRef: sanitizeRef(value.siteRef),
    issueSummaryRef: sanitizeRef(value.issueSummaryRef),
    createdByActorId: stringValue(value.createdByActorId) || null,
  };
}

function sanitizeAuditEvent(value) {
  if (!isObject(value)) {
    return null;
  }

  return {
    eventType: stringValue(value.eventType) || null,
    outcome: stringValue(value.outcome) || null,
    draftId: stringValue(value.draftId) || null,
    organizationId: stringValue(value.organizationId) || null,
    actorId: stringValue(value.actorId) || null,
    requestId: stringValue(value.requestId) || null,
    idempotencyKey: stringValue(value.idempotencyKey) || null,
    caseRef: sanitizeCaseRef(value.caseRef),
    reasonCode: stringValue(value.reasonCode) || null,
    requiredActions: safeArray(value.requiredActions),
  };
}

function sanitizeEnvelopeBody(value) {
  const source = sanitizeTopLevelEnvelopeSource(value);

  return {
    ok: source.ok === true,
    action: stringValue(source.action) || null,
    draftId: stringValue(source.draftId) || null,
    organizationId: stringValue(source.organizationId) || null,
    submitted: source.submitted === true,
    eligible: source.eligible === true,
    status: stringValue(source.status) || null,
    caseCreationAllowed: source.caseCreationAllowed === true,
    candidateReady: source.candidateReady === true,
    reasonCode: stringValue(source.reasonCode) || 'CONTROLLER_RESULT_UNAVAILABLE',
    requiredActions: safeArray(source.requiredActions),
    caseRef: sanitizeCaseRef(source.caseRef),
    caseCandidate: sanitizeCaseCandidate(source.caseCandidate),
    auditEvent: sanitizeAuditEvent(source.auditEvent),
  };
}

function statusCodeFor(body) {
  if (body.ok === true) {
    return 200;
  }

  if (body.reasonCode === 'CONTROLLER_APPLICATION_SERVICE_NOT_CONFIGURED') {
    return 500;
  }

  return 409;
}

function safeFailure(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    statusCode: 500,
    body: {
      ok: false,
      action: null,
      draftId: null,
      organizationId: null,
      submitted: false,
      eligible: false,
      status: 'failed',
      caseCreationAllowed: false,
      candidateReady: false,
      reasonCode,
      requiredActions,
      caseRef: null,
      caseCandidate: null,
      auditEvent: null,
    },
  };
}

function assertApplicationService(applicationService) {
  if (!isObject(applicationService)) {
    throw new RepairIntakeDraftCaseControllerAdapterError(
      'REPAIR_INTAKE_DRAFT_CASE_CONTROLLER_APPLICATION_SERVICE_REQUIRED',
      ['configure_application_service'],
    );
  }
}

async function callService(method, input) {
  if (typeof method !== 'function') {
    return safeFailure(
      'CONTROLLER_APPLICATION_SERVICE_NOT_CONFIGURED',
      ['configure_application_service'],
    );
  }

  try {
    const output = await method(input);

    if (!isObject(output)) {
      return safeFailure(
        'CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID',
        ['retry_or_manual_review'],
      );
    }

    const body = sanitizeEnvelopeBody(output);

    return {
      ok: body.ok,
      statusCode: statusCodeFor(body),
      body,
    };
  } catch (error) {
    return safeFailure(
      'CONTROLLER_APPLICATION_SERVICE_FAILED',
      ['retry_or_manual_review'],
    );
  }
}

function createRepairIntakeDraftCaseControllerAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const applicationService = safeOptions.applicationService;

  assertApplicationService(applicationService);

  async function planDraftToCase(requestLike = {}) {
    return callService(
      applicationService.planDraftToCase,
      sanitizeRequestInput(requestLike),
    );
  }

  async function submitDraftToCase(requestLike = {}) {
    return callService(
      applicationService.submitDraftToCase,
      sanitizeRequestInput(requestLike),
    );
  }

  return {
    planDraftToCase,
    submitDraftToCase,
  };
}

module.exports = {
  RepairIntakeDraftCaseControllerAdapterError,
  createRepairIntakeDraftCaseControllerAdapter,
};
