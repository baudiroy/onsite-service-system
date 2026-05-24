'use strict';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'database_url',
  'databaseurl',
  'db',
  'error',
  'finalappointmentid',
  'handler',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'phone',
  'raw',
  'rawbody',
  'rawdraft',
  'rawinput',
  'rawplan',
  'rawportoutput',
  'rawrow',
  'rawrows',
  'repository',
  'secret',
  'sql',
  'stack',
  'token',
]);

class RepairIntakeCaseCreatorPortAdapterError extends Error {
  constructor(reasonCode, requiredActions = ['configure_case_creation_port']) {
    super(reasonCode);
    this.name = 'RepairIntakeCaseCreatorPortAdapterError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function fieldIsUnsafe(key) {
  return UNSAFE_FIELD_NAMES.has(String(key).toLowerCase());
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeValue(fieldValue);

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
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function firstSafeString(...values) {
  for (const value of values) {
    const candidate = safeString(value);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== null),
  );
}

function failureEnvelope(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    id: null,
    caseId: null,
    organizationId: null,
    sourceDraftId: null,
    status: 'failed',
    reasonCode,
    requiredActions,
    summary: null,
  };
}

function draftSummary(draft) {
  return sanitizeValue(compactObject({
    id: firstSafeString(draft.id, draft.draftId),
    draftId: firstSafeString(draft.draftId, draft.id),
    organizationId: safeString(draft.organizationId),
    tenantId: safeString(draft.tenantId),
    status: safeString(draft.status),
    source: draft.source,
    sourceRef: draft.sourceRef,
    intakeSource: draft.intakeSource,
    reasonCode: safeString(draft.reasonCode),
    requiredActions: safeArray(draft.requiredActions),
    summary: draft.summary,
  }));
}

function planSummary(plan) {
  return sanitizeValue(compactObject({
    status: safeString(plan.status),
    reasonCode: safeString(plan.reasonCode),
    requiredActions: safeArray(plan.requiredActions),
    candidate: plan.candidate,
    caseCandidate: plan.caseCandidate,
    metadata: plan.metadata,
    warnings: safeArray(plan.warnings),
  }));
}

function createCreationInput(input) {
  const draft = draftSummary(input.draft);
  const plan = planSummary(input.plan);

  return sanitizeValue(compactObject({
    draft,
    plan,
    draftId: firstSafeString(input.draftId, draft.draftId, draft.id, plan.candidate && plan.candidate.sourceDraftId),
    organizationId: firstSafeString(
      input.organizationId,
      input.context && input.context.organizationId,
      draft.organizationId,
      plan.candidate && plan.candidate.organizationId,
    ),
    tenantId: firstSafeString(
      input.tenantId,
      input.context && input.context.tenantId,
      draft.tenantId,
      plan.candidate && plan.candidate.tenantId,
    ),
    requestId: firstSafeString(input.requestId, input.context && input.context.requestId),
    actor: input.actor || (input.context && { actorId: input.context.actorId }),
    metadata: input.metadata,
    warnings: input.warnings || plan.warnings,
  }));
}

function caseRefEnvelope(creationInput, caseRef = {}) {
  const caseId = firstSafeString(caseRef.caseId, caseRef.id);

  return sanitizeValue({
    ok: caseRef.ok !== false,
    id: caseId,
    caseId,
    organizationId: firstSafeString(caseRef.organizationId, creationInput.organizationId),
    tenantId: firstSafeString(caseRef.tenantId, creationInput.tenantId),
    sourceDraftId: firstSafeString(caseRef.sourceDraftId, creationInput.draftId),
    status: safeString(caseRef.status) || 'created',
    reasonCode: safeString(caseRef.reasonCode) || 'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CASE_CREATED',
    requiredActions: safeArray(caseRef.requiredActions),
    summary: caseRef.summary || null,
    metadata: caseRef.metadata || null,
  });
}

function createRepairIntakeCaseCreatorPortAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const { caseCreationPort } = safeOptions;

  if (!isObject(caseCreationPort) || typeof caseCreationPort.createCaseFromDraft !== 'function') {
    throw new RepairIntakeCaseCreatorPortAdapterError(
      'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATION_PORT_REQUIRED',
      ['configure_case_creation_port_create_case_from_draft'],
    );
  }

  async function createCaseFromDraft(input) {
    if (!isObject(input) || !isObject(input.draft) || !isObject(input.plan)) {
      return failureEnvelope(
        'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_INPUT_INVALID',
        ['provide_valid_creation_input'],
      );
    }

    const creationInput = createCreationInput(sanitizeValue(input));

    if (!isObject(creationInput.draft) || !isObject(creationInput.plan) || !safeString(creationInput.draftId)) {
      return failureEnvelope(
        'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_INPUT_INVALID',
        ['provide_valid_draft_and_plan_summary'],
      );
    }

    try {
      const caseRef = sanitizeValue(await caseCreationPort.createCaseFromDraft(creationInput));

      if (!isObject(caseRef)) {
        return failureEnvelope('REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED');
      }

      return caseRefEnvelope(creationInput, caseRef);
    } catch (error) {
      return failureEnvelope('REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED');
    }
  }

  return {
    createCaseFromDraft,
  };
}

module.exports = {
  RepairIntakeCaseCreatorPortAdapterError,
  createRepairIntakeCaseCreatorPortAdapter,
};
