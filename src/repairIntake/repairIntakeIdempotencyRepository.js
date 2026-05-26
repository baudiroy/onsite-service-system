'use strict';

const DEFAULT_OPERATION_TYPE = 'draft_to_case';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'databaseurl',
  'db',
  'error',
  'finalappointmentid',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'params',
  'phone',
  'raw',
  'rawbody',
  'rawrequestbody',
  'rawresult',
  'rawrow',
  'rawrows',
  'secret',
  'sql',
  'stack',
  'token',
]);

class RepairIntakeIdempotencyRepositoryError extends Error {
  constructor(reasonCode, requiredActions = ['retry_or_manual_review']) {
    super(reasonCode);
    this.name = 'RepairIntakeIdempotencyRepositoryError';
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

function createLookup(input) {
  if (!isPlainObject(input)) {
    throw new RepairIntakeIdempotencyRepositoryError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_INPUT_INVALID',
      ['provide_valid_lookup_input'],
    );
  }

  const idempotencyKey = safeString(input.idempotencyKey);
  const organizationId = safeString(input.organizationId);

  if (!idempotencyKey) {
    throw new RepairIntakeIdempotencyRepositoryError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_INPUT_INVALID',
      ['provide_idempotency_key'],
    );
  }

  if (!organizationId) {
    throw new RepairIntakeIdempotencyRepositoryError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_INPUT_INVALID',
      ['provide_organization_id'],
    );
  }

  return {
    actorId: safeString(input.actorId),
    draftId: safeString(input.draftId),
    idempotencyKey,
    operationType: safeString(input.operationType) || safeString(input.action) || DEFAULT_OPERATION_TYPE,
    organizationId,
    requestId: safeString(input.requestId),
    tenantId: safeString(input.tenantId),
  };
}

function createRecord(input) {
  const lookup = createLookup(input);
  const result = safeObject(input.result);
  const caseRef = safeObject(input.caseRef);
  const caseId = firstSafeString(input.caseId, result.caseId, caseRef.caseId);
  const caseRefText = firstSafeString(input.caseRef, caseRef.caseRef, result.caseRef);
  const safeRequestFingerprint = firstSafeString(
    input.safeRequestFingerprint,
    input.requestFingerprint,
    input.fingerprint,
  );

  if (!caseId && !caseRefText) {
    throw new RepairIntakeIdempotencyRepositoryError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORD_INPUT_INVALID',
      ['provide_safe_result_or_case_ref'],
    );
  }

  if (!safeRequestFingerprint) {
    throw new RepairIntakeIdempotencyRepositoryError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORD_INPUT_INVALID',
      ['provide_safe_request_fingerprint'],
    );
  }

  return {
    ...lookup,
    caseId,
    caseRefText,
    expiresAt: safeString(input.expiresAt),
    recordStatus: safeString(input.recordStatus) || safeString(result.status) || 'completed',
    replayResultSafe: sanitizeNestedValue({
      ...result,
      caseId,
      caseRef: caseRefText ? { caseRef: caseRefText, caseId } : undefined,
      draftId: lookup.draftId || result.draftId,
      organizationId: lookup.organizationId,
      tenantId: lookup.tenantId,
      requestId: lookup.requestId || result.requestId,
      actorId: lookup.actorId || result.actorId,
      status: safeString(result.status) || 'submitted',
      submitted: result.submitted !== false,
    }),
    retentionUntil: safeString(input.retentionUntil),
    safeRequestFingerprint,
  };
}

function createSelectStatement(lookup) {
  const clauses = [
    'organization_id = $1',
    'operation_type = $2',
    'idempotency_key = $3',
  ];
  const params = [
    lookup.organizationId,
    lookup.operationType,
    lookup.idempotencyKey,
  ];

  if (lookup.tenantId) {
    params.push(lookup.tenantId);
    clauses.push(`tenant_id = $${params.length}`);
  }

  return {
    params,
    text: [
      'SELECT',
      '    id,',
      '    organization_id,',
      '    tenant_id,',
      '    idempotency_key,',
      '    operation_type,',
      '    draft_id,',
      '    replay_case_id,',
      '    replay_case_ref,',
      '    replay_result_safe,',
      '    record_status,',
      '    completed_at,',
      '    expires_at',
      'FROM repair_intake_idempotency_records',
      `WHERE ${clauses.join(' AND ')}`,
      'LIMIT 1',
    ].join('\n'),
  };
}

function createInsertStatement(record) {
  return {
    params: [
      record.organizationId,
      record.tenantId,
      record.idempotencyKey,
      record.operationType,
      record.draftId,
      record.safeRequestFingerprint,
      record.caseId,
      record.caseRefText,
      JSON.stringify(record.replayResultSafe),
      record.recordStatus,
      record.expiresAt,
      record.retentionUntil,
    ],
    text: [
      'INSERT INTO repair_intake_idempotency_records (',
      '    organization_id,',
      '    tenant_id,',
      '    idempotency_key,',
      '    operation_type,',
      '    draft_id,',
      '    safe_request_fingerprint,',
      '    replay_case_id,',
      '    replay_case_ref,',
      '    replay_result_safe,',
      '    record_status,',
      '    completed_at,',
      '    expires_at,',
      '    retention_until',
      ') VALUES (',
      '    $1,',
      '    $2,',
      '    $3,',
      '    $4,',
      '    $5,',
      '    $6,',
      '    $7,',
      '    $8,',
      '    $9::jsonb,',
      '    $10,',
      '    now(),',
      '    $11,',
      '    $12',
      ')',
      'ON CONFLICT (',
      '    organization_id,',
      "    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),",
      '    operation_type,',
      '    idempotency_key',
      ') DO NOTHING',
      'RETURNING',
      '    id,',
      '    organization_id,',
      '    tenant_id,',
      '    idempotency_key,',
      '    operation_type,',
      '    draft_id,',
      '    replay_case_id,',
      '    replay_case_ref,',
      '    replay_result_safe,',
      '    record_status,',
      '    completed_at,',
      '    expires_at',
    ].join('\n'),
  };
}

function resolveRows(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (
    result
    && typeof result === 'object'
    && !Array.isArray(result)
    && Array.isArray(result.rows)
  ) {
    return result.rows;
  }

  return [];
}

function mapReplayRow(row, lookup) {
  if (!isPlainObject(row)) {
    return null;
  }

  const result = safeObject(row.replay_result_safe);
  const caseId = safeString(row.replay_case_id) || safeString(result.caseId);
  const caseRefText = safeString(row.replay_case_ref);

  return sanitizeNestedValue({
    action: safeString(row.operation_type) || lookup.operationType,
    idempotencyKey: safeString(row.idempotency_key) || lookup.idempotencyKey,
    draftId: safeString(row.draft_id) || lookup.draftId,
    caseId,
    caseRef: caseRefText ? { caseRef: caseRefText, caseId } : undefined,
    organizationId: safeString(row.organization_id) || lookup.organizationId,
    tenantId: safeString(row.tenant_id) || lookup.tenantId,
    requestId: lookup.requestId,
    actorId: lookup.actorId,
    status: safeString(row.record_status) || safeString(result.status) || 'completed',
    submitted: safeString(row.record_status) !== 'failed',
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_REPLAY_READY',
    requiredActions: [],
    result,
    metadata: {
      recordId: safeString(row.id),
    },
    warnings: [],
  });
}

function mapRecordedRow(row, record) {
  const source = isPlainObject(row) ? row : {};
  const result = safeObject(source.replay_result_safe);
  const fallbackResult = safeObject(record.replayResultSafe);
  const replayResult = Object.keys(result).length > 0 ? result : fallbackResult;
  const caseId = firstSafeString(source.replay_case_id, replayResult.caseId, record.caseId);
  const caseRefText = firstSafeString(source.replay_case_ref, record.caseRefText);

  return sanitizeNestedValue({
    action: firstSafeString(source.operation_type, record.operationType),
    idempotencyKey: firstSafeString(source.idempotency_key, record.idempotencyKey),
    draftId: firstSafeString(source.draft_id, replayResult.draftId, record.draftId),
    caseId,
    caseRef: caseRefText ? { caseRef: caseRefText, caseId } : undefined,
    organizationId: firstSafeString(source.organization_id, record.organizationId),
    tenantId: firstSafeString(source.tenant_id, record.tenantId),
    requestId: record.requestId,
    actorId: record.actorId,
    status: firstSafeString(source.record_status, replayResult.status, record.recordStatus, 'completed'),
    submitted: firstSafeString(source.record_status, record.recordStatus) !== 'failed',
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED',
    requiredActions: [],
    result: replayResult,
    metadata: {
      recordId: firstSafeString(source.id),
    },
    warnings: [],
  });
}

function assertDbClient(dbClient) {
  if (!dbClient || typeof dbClient !== 'object' || typeof dbClient.query !== 'function') {
    throw new RepairIntakeIdempotencyRepositoryError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_DB_CLIENT_REQUIRED',
      ['provide_injected_query_client'],
    );
  }
}

function createRepairIntakeIdempotencyRepository(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const { dbClient } = safeOptions;

  assertDbClient(dbClient);

  async function findExistingDraftToCaseResult(input) {
    const lookup = createLookup(sanitizeNestedValue(input));
    const statement = createSelectStatement(lookup);

    try {
      const result = await dbClient.query(statement.text, statement.params);
      const [row] = resolveRows(result);

      return mapReplayRow(row, lookup);
    } catch (error) {
      throw new RepairIntakeIdempotencyRepositoryError(
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_QUERY_FAILED',
        ['retry_or_manual_review'],
      );
    }
  }

  async function recordDraftToCaseResult(input) {
    const record = createRecord(sanitizeNestedValue(input));
    const statement = createInsertStatement(record);

    try {
      const result = await dbClient.query(statement.text, statement.params);
      const [row] = resolveRows(result);

      return mapRecordedRow(row, record);
    } catch (error) {
      throw new RepairIntakeIdempotencyRepositoryError(
        'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORD_FAILED',
        ['retry_or_manual_review'],
      );
    }
  }

  return {
    findExistingDraftToCaseResult,
    recordDraftToCaseResult,
  };
}

module.exports = {
  RepairIntakeIdempotencyRepositoryError,
  createRepairIntakeIdempotencyRepository,
};
