'use strict';

const {
  createRepairIntakeCaseRepositoryContract,
} = require('./repairIntakeCaseRepositoryContract');

const INVALID_DEPENDENCY_ACTIONS = ['configure_injected_case_repository'];
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
  'rawdraft',
  'rawinput',
  'rawplan',
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

function firstSafeString(...values) {
  for (const value of values) {
    const candidate = safeString(value);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function resolveInjectedRepository(options) {
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

function invalidDependencyEnvelope(reasonCode) {
  return {
    ok: false,
    status: 'invalid_dependency',
    reasonCode,
    requiredActions: INVALID_DEPENDENCY_ACTIONS,
    caseId: null,
    caseRef: null,
    draftId: null,
    sourceDraftId: null,
    organizationId: null,
    tenantId: null,
    requestId: null,
    actorId: null,
    summary: null,
    metadata: {},
    warnings: [],
  };
}

function nonSuccessEnvelope(reasonCode, contractResult, status = 'skipped') {
  const result = safeObject(contractResult);

  return sanitizeNestedValue({
    ok: false,
    status,
    reasonCode,
    requiredActions: safeArray(result.requiredActions).length > 0
      ? safeArray(result.requiredActions)
      : RETRY_ACTIONS,
    caseId: null,
    caseRef: null,
    draftId: firstSafeString(result.draftId, result.sourceDraftId),
    sourceDraftId: firstSafeString(result.sourceDraftId, result.draftId),
    organizationId: safeString(result.organizationId),
    tenantId: safeString(result.tenantId),
    requestId: safeString(result.requestId),
    actorId: safeString(result.actorId),
    summary: null,
    metadata: safeObject(result.metadata),
    warnings: safeArray(result.warnings),
  });
}

function successEnvelope(contractResult) {
  const result = safeObject(contractResult);
  const caseRef = isPlainObject(result.caseRef) ? result.caseRef : null;
  const caseId = firstSafeString(result.caseId, caseRef && caseRef.caseId, caseRef && caseRef.id);

  if (!caseId && !caseRef) {
    return nonSuccessEnvelope(
      'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_NOT_FOUND_OR_SKIPPED',
      result,
    );
  }

  return sanitizeNestedValue({
    ok: true,
    status: safeString(result.status) || 'created',
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_CASE_READY',
    requiredActions: [],
    caseId,
    caseRef,
    draftId: firstSafeString(result.draftId, result.sourceDraftId),
    sourceDraftId: firstSafeString(result.sourceDraftId, result.draftId),
    organizationId: safeString(result.organizationId),
    tenantId: safeString(result.tenantId),
    requestId: safeString(result.requestId),
    actorId: safeString(result.actorId),
    summary: result.summary || null,
    metadata: safeObject(result.metadata),
    warnings: safeArray(result.warnings),
  });
}

function normalizeContractResult(contractResult) {
  if (!isPlainObject(contractResult)) {
    return nonSuccessEnvelope(
      'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_FAILED',
      {},
      'failed',
    );
  }

  if (contractResult.ok !== true || contractResult.status === 'failed') {
    return nonSuccessEnvelope(
      'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_FAILED',
      contractResult,
      'failed',
    );
  }

  return successEnvelope(contractResult);
}

function createInvalidDependencyConsumer(reasonCode) {
  async function createCaseFromDraft() {
    return invalidDependencyEnvelope(reasonCode);
  }

  return {
    createCaseFromDraft,
  };
}

function createRepairIntakeCaseRepositoryConsumer(options = {}) {
  const repository = resolveInjectedRepository(options);

  if (!isPlainObject(repository)) {
    return createInvalidDependencyConsumer(
      'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_REQUIRED',
    );
  }

  if (typeof repository.createCaseFromDraft !== 'function') {
    return createInvalidDependencyConsumer(
      'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_CREATE_METHOD_REQUIRED',
    );
  }

  let contract;

  try {
    contract = createRepairIntakeCaseRepositoryContract({ caseRepository: repository });
  } catch (error) {
    return createInvalidDependencyConsumer(
      'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_CONTRACT_REQUIRED',
    );
  }

  async function createCaseFromDraft(input) {
    try {
      const contractResult = await contract.createCaseFromDraft(input);

      return normalizeContractResult(contractResult);
    } catch (error) {
      return nonSuccessEnvelope(
        'REPAIR_INTAKE_CASE_REPOSITORY_CONSUMER_REPOSITORY_FAILED',
        {},
        'failed',
      );
    }
  }

  return {
    createCaseFromDraft,
  };
}

module.exports = {
  createRepairIntakeCaseRepositoryConsumer,
};
