'use strict';

const SAFE_FIELD_NAMES = new Set([
  'actorId',
  'draftId',
  'intakeSource',
  'metadata',
  'organizationId',
  'requestId',
  'source',
  'sourceRef',
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
  'rawRow',
  'rawRows',
  'repository',
  'sql',
  'stack',
  'connection',
]);

class RepairIntakeDraftRepositoryContractError extends Error {
  constructor(reasonCode, requiredActions = ['configure_draft_repository_contract']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftRepositoryContractError';
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

  return [...UNSAFE_FIELD_NAMES].some((fieldName) => normalizedFieldName(fieldName) === normalized);
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

function failureEnvelope(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
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

function notFoundEnvelope() {
  return {
    ok: false,
    draftId: null,
    organizationId: null,
    tenantId: null,
    status: 'not_found',
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_NOT_FOUND',
    requiredActions: ['verify_draft_exists'],
    summary: null,
    metadata: {},
    warnings: [],
  };
}

function readyEnvelope(draft) {
  const fields = sanitizeContractFields(draft);
  const draftId = safeString(fields.draftId);

  return sanitizeNestedValue({
    ok: true,
    draftId,
    organizationId: safeString(fields.organizationId),
    tenantId: safeString(fields.tenantId),
    requestId: safeString(fields.requestId),
    actorId: safeString(fields.actorId),
    status: safeString(fields.status) || 'ready',
    source: fields.source,
    sourceRef: fields.sourceRef,
    intakeSource: fields.intakeSource,
    reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY',
    requiredActions: [],
    summary: fields.summary || null,
    metadata: isPlainObject(fields.metadata) ? fields.metadata : {},
    warnings: safeArray(fields.warnings),
  });
}

function resolveRepository(options) {
  if (isPlainObject(options) && typeof options.findDraftForConversion === 'function') {
    return options;
  }

  if (isPlainObject(options) && isPlainObject(options.draftRepository)) {
    return options.draftRepository;
  }

  if (isPlainObject(options) && isPlainObject(options.repository)) {
    return options.repository;
  }

  return null;
}

function createRepairIntakeDraftRepositoryContract(options = {}) {
  const repository = resolveRepository(options);

  if (!isPlainObject(repository) || typeof repository.findDraftForConversion !== 'function') {
    throw new RepairIntakeDraftRepositoryContractError(
      'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_REQUIRED',
      ['configure_find_draft_for_conversion'],
    );
  }

  async function findDraftForConversion(input) {
    if (!isPlainObject(input)) {
      return failureEnvelope(
        'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_valid_lookup_input'],
      );
    }

    const lookup = sanitizeContractFields(input);

    if (!safeString(lookup.draftId)) {
      return failureEnvelope(
        'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_draft_id'],
      );
    }

    try {
      const draft = await repository.findDraftForConversion(lookup);

      if (!isPlainObject(draft)) {
        return notFoundEnvelope();
      }

      return readyEnvelope(draft);
    } catch (error) {
      return failureEnvelope('REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_READ_FAILED');
    }
  }

  return {
    findDraftForConversion,
  };
}

module.exports = {
  RepairIntakeDraftRepositoryContractError,
  createRepairIntakeDraftRepositoryContract,
};
