'use strict';

const SAFE_FIELD_NAMES = new Set([
  'action',
  'actorId',
  'auditEvent',
  'caseId',
  'caseRef',
  'draftId',
  'idempotencyKey',
  'metadata',
  'ok',
  'operationType',
  'organizationId',
  'plan',
  'recordId',
  'reasonCode',
  'requestId',
  'requestFingerprint',
  'requiredActions',
  'result',
  'safeRequestFingerprint',
  'status',
  'submitted',
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
  'rawRequestBody',
  'rawSql',
  'repository',
  'secret',
  'sql',
  'stack',
  'token',
  'connection',
]);

class RepairIntakeIdempotencyRepositoryContractError extends Error {
  constructor(reasonCode, requiredActions = ['configure_idempotency_repository_contract']) {
    super(reasonCode);
    this.name = 'RepairIntakeIdempotencyRepositoryContractError';
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

function firstSafeString(...values) {
  for (const value of values) {
    const candidate = safeString(value);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function safeArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function hasUsefulObject(value) {
  return isPlainObject(value) && Object.keys(value).length > 0;
}

function createWriterRecordInput(recordInput) {
  const result = isPlainObject(recordInput.result) ? recordInput.result : {};
  const caseRef = isPlainObject(recordInput.caseRef)
    ? recordInput.caseRef
    : isPlainObject(result.caseRef)
      ? result.caseRef
      : {};
  const caseId = firstSafeString(recordInput.caseId, result.caseId, caseRef.caseId);
  const caseRefValue = hasUsefulObject(caseRef) ? caseRef : null;

  return sanitizeNestedValue({
    idempotencyKey: firstSafeString(recordInput.idempotencyKey),
    organizationId: firstSafeString(recordInput.organizationId),
    tenantId: firstSafeString(recordInput.tenantId),
    requestId: firstSafeString(recordInput.requestId),
    actorId: firstSafeString(recordInput.actorId),
    operationType: firstSafeString(recordInput.operationType, recordInput.action),
    draftId: firstSafeString(recordInput.draftId, result.draftId),
    caseId,
    caseRef: caseRefValue,
    result,
    safeRequestFingerprint: firstSafeString(
      recordInput.safeRequestFingerprint,
      recordInput.requestFingerprint,
    ),
    metadata: isPlainObject(recordInput.metadata) ? recordInput.metadata : undefined,
  });
}

function failureEnvelope(input, reasonCode, requiredActions = ['retry_or_manual_review']) {
  const safeInput = isPlainObject(input) ? sanitizeContractFields(input) : {};

  return sanitizeNestedValue({
    ok: false,
    idempotencyKey: firstSafeString(safeInput.idempotencyKey),
    draftId: firstSafeString(safeInput.draftId),
    caseId: null,
    caseRef: null,
    organizationId: firstSafeString(safeInput.organizationId),
    tenantId: firstSafeString(safeInput.tenantId),
    requestId: firstSafeString(safeInput.requestId),
    actorId: firstSafeString(safeInput.actorId),
    status: 'failed',
    submitted: false,
    reasonCode,
    requiredActions,
    result: null,
    metadata: {},
    warnings: [],
  });
}

function noExistingEnvelope(input) {
  return sanitizeNestedValue({
    ok: false,
    idempotencyKey: firstSafeString(input.idempotencyKey),
    draftId: firstSafeString(input.draftId),
    caseId: null,
    caseRef: null,
    organizationId: firstSafeString(input.organizationId),
    tenantId: firstSafeString(input.tenantId),
    requestId: firstSafeString(input.requestId),
    actorId: firstSafeString(input.actorId),
    status: 'not_found',
    submitted: false,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_NO_EXISTING_RESULT',
    requiredActions: [],
    result: null,
    metadata: {},
    warnings: [],
  });
}

function replayEnvelope(input, existingResult) {
  const fields = sanitizeContractFields(existingResult);
  const result = isPlainObject(fields.result) ? fields.result : {};
  const caseRef = isPlainObject(fields.caseRef)
    ? fields.caseRef
    : isPlainObject(result.caseRef)
      ? result.caseRef
      : null;

  return sanitizeNestedValue({
    ok: true,
    action: fields.action,
    idempotencyKey: firstSafeString(fields.idempotencyKey, input.idempotencyKey),
    draftId: firstSafeString(fields.draftId, result.draftId, input.draftId),
    caseId: firstSafeString(fields.caseId, result.caseId, caseRef && caseRef.caseId),
    caseRef,
    organizationId: firstSafeString(fields.organizationId, result.organizationId, input.organizationId),
    tenantId: firstSafeString(fields.tenantId, result.tenantId, input.tenantId),
    requestId: firstSafeString(fields.requestId, result.requestId, input.requestId),
    actorId: firstSafeString(fields.actorId, result.actorId, input.actorId),
    status: safeString(fields.status) || safeString(result.status) || 'submitted',
    submitted: fields.submitted !== false,
    reasonCode: safeString(fields.reasonCode)
      || 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_REPLAY_READY',
    requiredActions: safeArray(fields.requiredActions),
    result,
    metadata: isPlainObject(fields.metadata) ? fields.metadata : {},
    warnings: safeArray(fields.warnings),
    plan: isPlainObject(fields.plan) ? fields.plan : undefined,
    auditEvent: isPlainObject(fields.auditEvent) ? fields.auditEvent : undefined,
  });
}

function recordedEnvelope(input, storedResult) {
  const fields = sanitizeContractFields(storedResult);
  const result = isPlainObject(fields.result) ? fields.result : isPlainObject(input.result) ? input.result : {};
  const caseRef = isPlainObject(fields.caseRef)
    ? fields.caseRef
    : isPlainObject(input.caseRef)
      ? input.caseRef
      : isPlainObject(result.caseRef)
        ? result.caseRef
        : null;

  return sanitizeNestedValue({
    ok: true,
    action: fields.action,
    idempotencyKey: firstSafeString(fields.idempotencyKey, input.idempotencyKey),
    draftId: firstSafeString(fields.draftId, result.draftId, input.draftId),
    caseId: firstSafeString(fields.caseId, result.caseId, caseRef && caseRef.caseId),
    caseRef,
    organizationId: firstSafeString(fields.organizationId, result.organizationId, input.organizationId),
    tenantId: firstSafeString(fields.tenantId, result.tenantId, input.tenantId),
    requestId: firstSafeString(fields.requestId, result.requestId, input.requestId),
    actorId: firstSafeString(fields.actorId, result.actorId, input.actorId),
    status: safeString(fields.status) || safeString(result.status) || 'recorded',
    submitted: fields.submitted !== false,
    reasonCode: safeString(fields.reasonCode)
      || 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORDED',
    requiredActions: safeArray(fields.requiredActions),
    result,
    metadata: isPlainObject(fields.metadata) ? fields.metadata : {},
    warnings: safeArray(fields.warnings),
    recordId: firstSafeString(fields.recordId),
    plan: isPlainObject(fields.plan) ? fields.plan : undefined,
    auditEvent: isPlainObject(fields.auditEvent) ? fields.auditEvent : undefined,
  });
}

function resolveRepository(options) {
  if (isPlainObject(options)
    && typeof options.findExistingDraftToCaseResult === 'function'
    && typeof options.recordDraftToCaseResult === 'function') {
    return options;
  }

  for (const key of ['idempotencyRepository', 'idempotencyStore', 'repository']) {
    if (isPlainObject(options) && isPlainObject(options[key])) {
      return options[key];
    }
  }

  return null;
}

function createRepairIntakeIdempotencyRepositoryContract(options = {}) {
  const repository = resolveRepository(options);

  if (!isPlainObject(repository)
    || typeof repository.findExistingDraftToCaseResult !== 'function'
    || typeof repository.recordDraftToCaseResult !== 'function') {
    throw new RepairIntakeIdempotencyRepositoryContractError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_REQUIRED',
      ['configure_idempotency_contract_methods'],
    );
  }

  async function findExistingDraftToCaseResult(input) {
    if (!isPlainObject(input)) {
      return failureEnvelope(
        input,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_plain_object_input'],
      );
    }

    const lookup = sanitizeContractFields(input);

    if (!safeString(lookup.idempotencyKey)) {
      return failureEnvelope(
        lookup,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_idempotency_key'],
      );
    }

    try {
      const existingResult = await repository.findExistingDraftToCaseResult(lookup);

      if (!isPlainObject(existingResult)) {
        return noExistingEnvelope(lookup);
      }

      return replayEnvelope(lookup, existingResult);
    } catch (error) {
      return failureEnvelope(
        lookup,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_FIND_FAILED',
      );
    }
  }

  async function recordDraftToCaseResult(input) {
    if (!isPlainObject(input)) {
      return failureEnvelope(
        input,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_plain_object_input'],
      );
    }

    const recordInput = sanitizeContractFields(input);

    if (!safeString(recordInput.idempotencyKey)) {
      return failureEnvelope(
        recordInput,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_idempotency_key'],
      );
    }

    if (!safeString(recordInput.organizationId)) {
      return failureEnvelope(
        recordInput,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_organization_id'],
      );
    }

    if (!firstSafeString(recordInput.safeRequestFingerprint, recordInput.requestFingerprint)) {
      return failureEnvelope(
        recordInput,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_request_fingerprint'],
      );
    }

    if (!hasUsefulObject(recordInput.result) && !hasUsefulObject(recordInput.caseRef)) {
      return failureEnvelope(
        recordInput,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_INPUT_INVALID',
        ['provide_result_or_case_ref'],
      );
    }

    try {
      const writerRecordInput = createWriterRecordInput(recordInput);
      const storedResult = await repository.recordDraftToCaseResult(writerRecordInput);

      if (!isPlainObject(storedResult)) {
        return failureEnvelope(
          recordInput,
          'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORD_FAILED',
        );
      }

      return recordedEnvelope(recordInput, storedResult);
    } catch (error) {
      return failureEnvelope(
        recordInput,
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORD_FAILED',
      );
    }
  }

  return {
    findExistingDraftToCaseResult,
    recordDraftToCaseResult,
  };
}

module.exports = {
  RepairIntakeIdempotencyRepositoryContractError,
  createRepairIntakeIdempotencyRepositoryContract,
};
