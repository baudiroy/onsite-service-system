'use strict';

const DEFAULT_TABLE_NAME = 'repair_intake_draft_case_submissions';

const FORBIDDEN_INPUT_FIELDS = new Set([
  'address',
  'caseId',
  'case_id',
  'customerPayload',
  'finalAppointmentId',
  'final_appointment_id',
  'fullAddress',
  'lineAccessToken',
  'phone',
  'phoneNumber',
  'providerPayload',
  'rawAddress',
  'rawCustomerPayload',
  'rawImportedRow',
  'rawImportedRowPayload',
  'rawPayload',
  'secret',
  'token',
  'tokenSecret',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeTableName(value) {
  const tableName = stringValue(value) || DEFAULT_TABLE_NAME;

  return /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(tableName) ? tableName : null;
}

function available() {
  return {
    ok: true,
    decision: 'available',
    reasonCode: 'IDEMPOTENCY_AVAILABLE',
    requiredActions: [],
    caseRef: null,
  };
}

function conflict(caseRef) {
  return {
    ok: false,
    decision: 'conflict',
    reasonCode: 'IDEMPOTENCY_CONFLICT',
    requiredActions: ['REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION'],
    caseRef,
  };
}

function failed(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    decision: 'failed',
    reasonCode,
    requiredActions,
    caseRef: null,
  };
}

function hasForbiddenInputField(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenInputField(item));
  }

  if (!isObject(value)) {
    return false;
  }

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_INPUT_FIELDS.has(key) || hasForbiddenInputField(child)) {
      return true;
    }
  }

  return false;
}

function normalizeInput(input) {
  if (!isObject(input)) {
    return failed('IDEMPOTENCY_CHECK_INPUT_MISSING', ['provide_idempotency_context']);
  }

  if (hasForbiddenInputField(input)) {
    return failed('IDEMPOTENCY_CHECK_UNSAFE_INPUT', ['provide_sanitized_idempotency_context']);
  }

  const draftId = stringValue(input.draftId);
  const organizationId = stringValue(input.organizationId);
  const idempotencyKey = stringValue(input.idempotencyKey);

  if (!draftId) {
    return failed('IDEMPOTENCY_DRAFT_ID_MISSING', ['provide_draft_id']);
  }

  if (!organizationId) {
    return failed('IDEMPOTENCY_ORGANIZATION_MISSING', ['provide_organization_scope']);
  }

  if (!idempotencyKey) {
    return failed('IDEMPOTENCY_KEY_MISSING', ['provide_idempotency_key']);
  }

  return {
    ok: true,
    draftId,
    organizationId,
    actorId: stringValue(input.actorId) || null,
    requestId: stringValue(input.requestId) || null,
    idempotencyKey,
  };
}

function queryText(tableName) {
  return [
    'select related_case_id, case_status, organization_id, source_draft_id',
    `from ${tableName}`,
    'where organization_id = $1 and source_draft_id = $2 and idempotency_key = $3',
    'limit 1',
  ].join(' ');
}

function queryValues(input) {
  return [
    input.organizationId,
    input.draftId,
    input.idempotencyKey,
  ];
}

function queryWhere(input) {
  return {
    organization_id: input.organizationId,
    source_draft_id: input.draftId,
    idempotency_key: input.idempotencyKey,
  };
}

function firstRow(result) {
  if (!result) {
    return null;
  }

  if (Array.isArray(result)) {
    return isObject(result[0]) ? result[0] : null;
  }

  if (
    isObject(result)
    && (
      isObject(result.caseRef)
      || isObject(result.existingCaseRef)
      || stringValue(result.id)
      || stringValue(result.related_case_id)
      || stringValue(result.case_ref_id)
    )
  ) {
    return result;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return isObject(result.rows[0]) ? result.rows[0] : null;
  }

  return isObject(result) ? result : null;
}

function sanitizeCaseRef(row) {
  if (!isObject(row)) {
    return null;
  }

  const source = isObject(row.caseRef) ? row.caseRef
    : isObject(row.existingCaseRef) ? row.existingCaseRef
      : row;

  const id = stringValue(source.id)
    || stringValue(source.related_case_id)
    || stringValue(source.case_ref_id);
  const organizationId = stringValue(source.organizationId || source.organization_id);
  const sourceDraftId = stringValue(source.sourceDraftId || source.source_draft_id || source.draft_id);
  const status = stringValue(source.status || source.case_status) || 'created';

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

function validateCaseRef(caseRef, input) {
  if (!caseRef) {
    return failed('IDEMPOTENCY_EXISTING_CASE_REF_MISSING', ['manual_review']);
  }

  if (caseRef.organizationId !== input.organizationId) {
    return failed('IDEMPOTENCY_CASE_REF_ORGANIZATION_MISMATCH', ['manual_review']);
  }

  if (caseRef.sourceDraftId !== input.draftId) {
    return failed('IDEMPOTENCY_CASE_REF_SOURCE_DRAFT_MISMATCH', ['manual_review']);
  }

  return null;
}

async function fetchExistingRecord({ client, tableName, input }) {
  if (typeof client.findOne === 'function') {
    return client.findOne(tableName, queryWhere(input));
  }

  if (typeof client.selectOne === 'function') {
    return client.selectOne(tableName, queryWhere(input));
  }

  if (typeof client.query === 'function') {
    return client.query(queryText(tableName), queryValues(input));
  }

  if (typeof client.execute === 'function') {
    return client.execute(queryText(tableName), queryValues(input));
  }

  return undefined;
}

function createRepairIntakeDraftCaseIdempotencyCheckerAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const dbClient = isObject(safeOptions.dbClient) ? safeOptions.dbClient : null;
  const tableName = safeTableName(safeOptions.tableName);

  async function checkDraftToCaseSubmission(input = {}) {
    const normalizedInput = normalizeInput(input);

    if (!isObject(normalizedInput) || normalizedInput.ok !== true) {
      return normalizedInput;
    }

    if (!dbClient) {
      return failed('IDEMPOTENCY_DB_CLIENT_NOT_CONFIGURED', ['configure_db_client']);
    }

    if (!tableName) {
      return failed('IDEMPOTENCY_TABLE_NAME_INVALID', ['configure_repository_table']);
    }

    let result;

    try {
      result = await fetchExistingRecord({
        client: dbClient,
        tableName,
        input: normalizedInput,
      });
    } catch (error) {
      return failed('IDEMPOTENCY_CHECK_FAILED', ['retry_or_manual_review']);
    }

    if (result === undefined) {
      return failed('IDEMPOTENCY_DB_CLIENT_UNSUPPORTED', ['configure_db_client']);
    }

    const row = firstRow(result);

    if (!row) {
      return available();
    }

    const caseRef = sanitizeCaseRef(row);
    const invalidCaseRef = validateCaseRef(caseRef, normalizedInput);

    if (invalidCaseRef) {
      return invalidCaseRef;
    }

    return conflict(caseRef);
  }

  return {
    checkDraftToCaseSubmission,
    check: checkDraftToCaseSubmission,
  };
}

module.exports = {
  createRepairIntakeDraftCaseIdempotencyCheckerAdapter,
};
