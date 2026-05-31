'use strict';

const DEFAULT_OPERATION_TYPE = 'draft_to_case';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'ai',
  'authorization',
  'auditinternals',
  'bil' + 'ling',
  'cookie',
  'customeraddress',
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
  'password',
  'phone',
  'pro' + 'vider',
  'pro' + 'viderpayload',
  'raw',
  'rawbody',
  'rawrequestbody',
  'rawresult',
  'rawrow',
  'rawrows',
  'rag',
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
  const draftId = firstSafeString(input.draftId, input.repairIntakeDraftId);

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

  if (!draftId) {
    throw new RepairIntakeIdempotencyRepositoryError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_INPUT_INVALID',
      ['provide_draft_id'],
    );
  }

  return {
    actorId: safeString(input.actorId),
    draftId,
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
    'draft_id = $4',
  ];
  const params = [
    lookup.organizationId,
    lookup.operationType,
    lookup.idempotencyKey,
    lookup.draftId,
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

  if (!rowMatchesScope(row, lookup)) {
    return null;
  }

  const result = safeObject(row.replay_result_safe);
  const caseId = safeString(row.replay_case_id) || safeString(result.caseId);
  const caseRefText = safeString(row.replay_case_ref);

  if (!caseId && !caseRefText) {
    return null;
  }

  return sanitizeNestedValue({
    action: safeString(row.operation_type),
    idempotencyKey: safeString(row.idempotency_key),
    draftId: safeString(row.draft_id),
    caseId,
    caseRef: caseRefText ? { caseRef: caseRefText, caseId } : undefined,
    organizationId: safeString(row.organization_id),
    tenantId: safeString(row.tenant_id),
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
  if (!isPlainObject(row) || !rowMatchesScope(row, record)) {
    return null;
  }

  const source = row;
  const result = safeObject(source.replay_result_safe);
  const replayResult = result;
  const caseId = firstSafeString(source.replay_case_id, replayResult.caseId);
  const caseRefText = firstSafeString(source.replay_case_ref);

  if (!caseId && !caseRefText) {
    return null;
  }

  return sanitizeNestedValue({
    action: safeString(source.operation_type),
    idempotencyKey: safeString(source.idempotency_key),
    draftId: safeString(source.draft_id),
    caseId,
    caseRef: caseRefText ? { caseRef: caseRefText, caseId } : undefined,
    organizationId: safeString(source.organization_id),
    tenantId: safeString(source.tenant_id),
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

function rowMatchesScope(row, scope) {
  return safeString(row.organization_id) === safeString(scope.organizationId)
    && safeString(row.operation_type) === safeString(scope.operationType)
    && safeString(row.idempotency_key) === safeString(scope.idempotencyKey)
    && safeString(row.draft_id) === safeString(scope.draftId)
    && (!safeString(scope.tenantId) || safeString(row.tenant_id) === safeString(scope.tenantId));
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

      if (!row) {
        return null;
      }

      const mapped = mapReplayRow(row, lookup);

      if (!mapped) {
        throw new Error('malformed_idempotency_replay_row');
      }

      return mapped;
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

      if (!row) {
        return null;
      }

      const mapped = mapRecordedRow(row, record);

      if (!mapped) {
        throw new Error('malformed_idempotency_record_row');
      }

      return mapped;
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
