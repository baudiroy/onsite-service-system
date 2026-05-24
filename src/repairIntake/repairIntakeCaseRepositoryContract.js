'use strict';

const SAFE_FIELD_NAMES = new Set([
  'actorId',
  'caseId',
  'caseRef',
  'draft',
  'draftId',
  'metadata',
  'organizationId',
  'plan',
  'requestId',
  'source',
  'sourceDraftId',
  'status',
  'summary',
  'tenantId',
  'warnings',
]);

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'cookie',
  'customerName',
  'customerPhone',
  'databaseUrl',
  'DATABASE_URL',
  'db',
  'error',
  'finalAppointmentId',
  'headers',
  'lineAccessToken',
  'lineUserId',
  'paramsSql',
  'phone',
  'query',
  'raw',
  'rawDraft',
  'rawPlan',
  'rawRow',
  'rawRows',
  'repository',
  'sql',
  'stack',
  'connection',
]);

class RepairIntakeCaseRepositoryContractError extends Error {
  constructor(reasonCode, requiredActions = ['configure_case_repository_contract']) {
    super(reasonCode);
    this.name = 'RepairIntakeCaseRepositoryContractError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
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
  const normalized = normalizedFieldName(key);

  return normalized.startsWith('raw')
    || [...UNSAFE_FIELD_NAMES].some((fieldName) => normalizedFieldName(fieldName) === normalized);
}

function fieldIsSafe(key) {
  const normalized = normalizedFieldName(key);

  return [...SAFE_FIELD_NAMES].some((fieldName) => normalizedFieldName(fieldName) === normalized);
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

function sanitizeContractFields(value) {
  const result = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldIsUnsafe(key) || !fieldIsSafe(key)) {
      continue;
    }

    const sanitized = sanitizeNestedValue(fieldValue);

    if (sanitized !== undefined) {
      result[key] = sanitized;
    }
  }

  return result;
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

function failureEnvelope(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    caseId: null,
    caseRef: null,
    draftId: null,
    organizationId: null,
    tenantId: null,
    status: 'failed',
    reasonCode,
    requiredActions,
    summary: null,
    metadata: {},
    warnings: [],
  };
}

function createdEnvelope(input, caseResult) {
  const fields = sanitizeContractFields(caseResult);
  const caseId = firstSafeString(fields.caseId, fields.caseRef && fields.caseRef.caseId);

  return sanitizeNestedValue({
    ok: true,
    caseId,
    caseRef: isPlainObject(fields.caseRef) ? fields.caseRef : null,
    draftId: firstSafeString(fields.draftId, fields.sourceDraftId, input.draftId),
    sourceDraftId: firstSafeString(fields.sourceDraftId, fields.draftId, input.draftId),
    organizationId: firstSafeString(fields.organizationId, input.organizationId),
    tenantId: firstSafeString(fields.tenantId, input.tenantId),
    requestId: firstSafeString(fields.requestId, input.requestId),
    actorId: firstSafeString(fields.actorId, input.actorId),
    status: safeString(fields.status) || 'created',
    source: fields.source,
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED',
    requiredActions: [],
    plan: isPlainObject(fields.plan) ? fields.plan : input.plan,
    summary: fields.summary || null,
    metadata: isPlainObject(fields.metadata) ? fields.metadata : {},
    warnings: safeArray(fields.warnings),
  });
}

function resolveRepository(options) {
  if (isPlainObject(options) && typeof options.createCaseFromDraft === 'function') {
    return options;
  }

  if (isPlainObject(options) && isPlainObject(options.caseRepository)) {
    return options.caseRepository;
  }

  if (isPlainObject(options) && isPlainObject(options.repository)) {
    return options.repository;
  }

  return null;
}

function createRepairIntakeCaseRepositoryContract(options = {}) {
  const repository = resolveRepository(options);

  if (!isPlainObject(repository) || typeof repository.createCaseFromDraft !== 'function') {
    throw new RepairIntakeCaseRepositoryContractError(
      'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_REQUIRED',
      ['configure_create_case_from_draft'],
    );
  }

  async function createCaseFromDraft(input) {
    if (!isPlainObject(input) || !isPlainObject(input.draft) || !isPlainObject(input.plan)) {
      return failureEnvelope(
        'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_valid_creation_input'],
      );
    }

    const creationInput = sanitizeContractFields(input);

    if (!isPlainObject(creationInput.draft) || !isPlainObject(creationInput.plan)) {
      return failureEnvelope(
        'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_valid_draft_and_plan'],
      );
    }

    try {
      const caseResult = await repository.createCaseFromDraft(creationInput);

      if (!isPlainObject(caseResult)) {
        return failureEnvelope('REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
      }

      return createdEnvelope(creationInput, caseResult);
    } catch (error) {
      return failureEnvelope('REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
    }
  }

  return {
    createCaseFromDraft,
  };
}

module.exports = {
  RepairIntakeCaseRepositoryContractError,
  createRepairIntakeCaseRepositoryContract,
};
