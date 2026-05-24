'use strict';

const DEFAULT_REQUIRED_ACTIONS = ['retry_or_manual_review'];

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
  'rawdraft',
  'rawinput',
  'rawplan',
  'rawresult',
  'rawrow',
  'rawrows',
  'repository',
  'secret',
  's' + 'ql',
  'stack',
  'token',
]);

class RepairIntakeCaseRepositoryError extends Error {
  constructor(reasonCode, requiredActions = ['configure_case_creation_dependency']) {
    super(reasonCode);
    this.name = 'RepairIntakeCaseRepositoryError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
    this.stack = undefined;
  }
}

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
  return UNSAFE_FIELD_NAMES.has(normalizedFieldName(key));
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

function firstSafeString(...values) {
  for (const value of values) {
    const candidate = safeString(value);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function safeObject(value) {
  return isPlainObject(value) ? sanitizeNestedValue(value) : {};
}

function safeArray(value) {
  return Array.isArray(value)
    ? sanitizeNestedValue(value).filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== null),
  );
}

function failureEnvelope(reasonCode, input = {}, requiredActions = DEFAULT_REQUIRED_ACTIONS) {
  const safeInput = safeObject(input);
  const draft = safeObject(safeInput.draft);
  const plan = safeObject(safeInput.plan);

  return sanitizeNestedValue({
    ok: false,
    caseId: null,
    caseRef: null,
    draftId: firstSafeString(safeInput.draftId, draft.draftId, draft.id, plan.sourceDraftId),
    sourceDraftId: firstSafeString(safeInput.sourceDraftId, safeInput.draftId, draft.draftId, draft.id),
    organizationId: firstSafeString(safeInput.organizationId, draft.organizationId, plan.organizationId),
    tenantId: firstSafeString(safeInput.tenantId, draft.tenantId, plan.tenantId),
    requestId: safeString(safeInput.requestId),
    actorId: firstSafeString(safeInput.actorId, safeInput.actor && safeInput.actor.actorId),
    status: 'failed',
    reasonCode,
    requiredActions,
    summary: null,
    metadata: {},
    warnings: [],
  });
}

function createCreationInput(input) {
  const safeInput = sanitizeNestedValue(input);

  if (!isPlainObject(safeInput) || !isPlainObject(safeInput.draft) || !isPlainObject(safeInput.plan)) {
    return null;
  }

  const draft = safeObject(safeInput.draft);
  const plan = safeObject(safeInput.plan);

  return sanitizeNestedValue(compactObject({
    draft,
    plan,
    draftId: firstSafeString(
      safeInput.draftId,
      safeInput.sourceDraftId,
      draft.draftId,
      draft.id,
      plan.sourceDraftId,
      plan.candidate && plan.candidate.sourceDraftId,
    ),
    sourceDraftId: firstSafeString(
      safeInput.sourceDraftId,
      safeInput.draftId,
      draft.draftId,
      draft.id,
      plan.sourceDraftId,
      plan.candidate && plan.candidate.sourceDraftId,
    ),
    organizationId: firstSafeString(
      safeInput.organizationId,
      safeInput.context && safeInput.context.organizationId,
      draft.organizationId,
      plan.organizationId,
      plan.candidate && plan.candidate.organizationId,
    ),
    tenantId: firstSafeString(
      safeInput.tenantId,
      safeInput.context && safeInput.context.tenantId,
      draft.tenantId,
      plan.tenantId,
      plan.candidate && plan.candidate.tenantId,
    ),
    requestId: firstSafeString(safeInput.requestId, safeInput.context && safeInput.context.requestId),
    actorId: firstSafeString(
      safeInput.actorId,
      safeInput.context && safeInput.context.actorId,
      safeInput.actor && safeInput.actor.actorId,
    ),
    metadata: safeObject(safeInput.metadata),
    warnings: safeArray(safeInput.warnings || plan.warnings),
  }));
}

function resolveCaseReference(result) {
  if (isPlainObject(result.caseRef)) {
    return sanitizeNestedValue(result.caseRef);
  }

  const caseRefText = safeString(result.caseRef);

  return caseRefText ? { caseRef: caseRefText } : null;
}

function createdEnvelope(creationInput, dependencyResult) {
  const result = safeObject(dependencyResult);
  const caseRef = resolveCaseReference(result);
  const caseId = firstSafeString(
    result.caseId,
    result.id,
    caseRef && caseRef.caseId,
    caseRef && caseRef.id,
  );

  return sanitizeNestedValue({
    ok: result.ok !== false && Boolean(caseId || caseRef),
    caseId,
    caseRef,
    draftId: firstSafeString(result.draftId, result.sourceDraftId, creationInput.draftId),
    sourceDraftId: firstSafeString(result.sourceDraftId, result.draftId, creationInput.sourceDraftId),
    organizationId: firstSafeString(result.organizationId, creationInput.organizationId),
    tenantId: firstSafeString(result.tenantId, creationInput.tenantId),
    requestId: firstSafeString(result.requestId, creationInput.requestId),
    actorId: firstSafeString(result.actorId, creationInput.actorId),
    status: safeString(result.status) || 'created',
    reasonCode: safeString(result.reasonCode) || 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_CREATED',
    requiredActions: safeArray(result.requiredActions),
    summary: result.summary || null,
    metadata: safeObject(result.metadata),
    warnings: safeArray(result.warnings),
  });
}

function resolveCaseCreationDependency(options) {
  if (!isPlainObject(options)) {
    return null;
  }

  const candidates = [
    options.caseCreationPort,
    options.caseService,
    options.caseRepository,
  ];

  return candidates.find((candidate) => (
    isPlainObject(candidate) && typeof candidate.createCaseFromDraft === 'function'
  )) || null;
}

function createRepairIntakeCaseRepository(options = {}) {
  const dependency = resolveCaseCreationDependency(options);

  if (!dependency) {
    throw new RepairIntakeCaseRepositoryError(
      'REPAIR_INTAKE_CASE_REPOSITORY_CASE_CREATION_DEPENDENCY_REQUIRED',
      ['configure_injected_case_creation_dependency'],
    );
  }

  async function createCaseFromDraft(input) {
    const creationInput = createCreationInput(input);

    if (!creationInput) {
      return failureEnvelope(
        'REPAIR_INTAKE_CASE_REPOSITORY_INPUT_INVALID',
        input,
        ['provide_valid_draft_and_plan'],
      );
    }

    try {
      const result = await dependency.createCaseFromDraft(creationInput);

      if (!isPlainObject(result)) {
        return failureEnvelope('REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED', creationInput);
      }

      const envelope = createdEnvelope(creationInput, result);

      if (!envelope.ok) {
        return failureEnvelope('REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED', creationInput);
      }

      return envelope;
    } catch (error) {
      return failureEnvelope('REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED', creationInput);
    }
  }

  return {
    createCaseFromDraft,
  };
}

module.exports = {
  RepairIntakeCaseRepositoryError,
  createRepairIntakeCaseRepository,
};
