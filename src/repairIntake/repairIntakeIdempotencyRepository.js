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

function resolveRows(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isPlainObject(result) && Array.isArray(result.rows)) {
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

function assertDbClient(dbClient) {
  if (!isPlainObject(dbClient) || typeof dbClient.query !== 'function') {
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

  async function recordDraftToCaseResult() {
    throw new RepairIntakeIdempotencyRepositoryError(
      'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_WRITER_NOT_IMPLEMENTED',
      ['use_read_only_find_existing_result'],
    );
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
