'use strict';

const DEFAULT_TABLE_NAME = 'repair_intake_drafts';

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

function blocked({ draftId = null, organizationId = null, caseId = null, reasonCode, requiredActions }) {
  return {
    ok: false,
    draftId,
    organizationId,
    caseId,
    status: 'blocked',
    reasonCode,
    requiredActions,
  };
}

function failed({ draftId = null, organizationId = null, caseId = null, reasonCode, requiredActions }) {
  return {
    ok: false,
    draftId,
    organizationId,
    caseId,
    status: 'failed',
    reasonCode,
    requiredActions,
  };
}

function linked({ draftId, organizationId, caseId }) {
  return {
    ok: true,
    draftId,
    organizationId,
    caseId,
    status: 'linked',
    reasonCode: 'REPAIR_INTAKE_DRAFT_LINKED_TO_CASE',
    requiredActions: [],
  };
}

function caseIdFrom(input) {
  return stringValue(input.caseId)
    || stringValue(input.case_id)
    || stringValue(input.caseRef && input.caseRef.id)
    || stringValue(input.case_ref && input.case_ref.id);
}

function normalizeInput(input) {
  if (!isObject(input)) {
    return blocked({
      reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_INPUT_MISSING',
      requiredActions: ['provide_draft_link_input'],
    });
  }

  const draftId = stringValue(input.draftId || input.draft_id);
  const organizationId = stringValue(input.organizationId || input.organization_id);
  const caseId = caseIdFrom(input);

  if (!draftId) {
    return blocked({
      organizationId: organizationId || null,
      caseId: caseId || null,
      reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_DRAFT_ID_MISSING',
      requiredActions: ['provide_draft_id'],
    });
  }

  if (!organizationId) {
    return blocked({
      draftId,
      caseId: caseId || null,
      reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_ORGANIZATION_MISSING',
      requiredActions: ['provide_organization_scope'],
    });
  }

  if (!caseId) {
    return blocked({
      draftId,
      organizationId,
      reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_CASE_ID_MISSING',
      requiredActions: ['provide_case_id'],
    });
  }

  return {
    ok: true,
    draftId,
    organizationId,
    caseId,
    actorId: stringValue(input.actorId || input.actor_id) || null,
    requestId: stringValue(input.requestId || input.request_id) || null,
    idempotencyKey: stringValue(input.idempotencyKey || input.idempotency_key) || null,
    tx: isObject(input.tx) ? input.tx : null,
  };
}

function resolveClock(clock) {
  if (typeof clock === 'function') {
    return clock;
  }

  if (isObject(clock) && typeof clock.now === 'function') {
    return clock.now.bind(clock);
  }

  return undefined;
}

function timestamp(clock) {
  if (!clock) {
    return null;
  }

  let value;

  try {
    value = clock();
  } catch (error) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return stringValue(value) || null;
}

function dbClientFor(input, baseClient) {
  return input.tx || baseClient;
}

function queryText(tableName) {
  return [
    `update ${tableName}`,
    'set linked_case_id = $1,',
    'linked_at = $2,',
    'linked_by_actor_id = $3,',
    'link_request_id = $4,',
    'link_idempotency_key = $5',
    'where id = $6 and organization_id = $7',
  ].join(' ');
}

function queryValues(input, linkedAt) {
  return [
    input.caseId,
    linkedAt,
    input.actorId,
    input.requestId,
    input.idempotencyKey,
    input.draftId,
    input.organizationId,
  ];
}

function updatePayload(input, linkedAt) {
  return {
    linked_case_id: input.caseId,
    linked_at: linkedAt,
    linked_by_actor_id: input.actorId,
    link_request_id: input.requestId,
    link_idempotency_key: input.idempotencyKey,
  };
}

function updateWhere(input) {
  return {
    id: input.draftId,
    organization_id: input.organizationId,
  };
}

function noRowsAffected(result) {
  return isObject(result) && Number.isInteger(result.rowCount) && result.rowCount < 1;
}

async function markWithClient({ client, tableName, input, linkedAt }) {
  if (!isObject(client)) {
    return failed({
      draftId: input.draftId,
      organizationId: input.organizationId,
      caseId: input.caseId,
      reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_DB_CLIENT_NOT_CONFIGURED',
      requiredActions: ['configure_db_client'],
    });
  }

  try {
    let result;

    if (typeof client.update === 'function') {
      result = await client.update(tableName, updatePayload(input, linkedAt), updateWhere(input));
    } else if (typeof client.query === 'function') {
      result = await client.query(queryText(tableName), queryValues(input, linkedAt));
    } else if (typeof client.execute === 'function') {
      result = await client.execute(queryText(tableName), queryValues(input, linkedAt));
    } else {
      return failed({
        draftId: input.draftId,
        organizationId: input.organizationId,
        caseId: input.caseId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_DB_CLIENT_UNSUPPORTED',
        requiredActions: ['configure_db_client'],
      });
    }

    if (isObject(result) && result.ok === false) {
      return failed({
        draftId: input.draftId,
        organizationId: input.organizationId,
        caseId: input.caseId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_DB_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    if (noRowsAffected(result)) {
      return blocked({
        draftId: input.draftId,
        organizationId: input.organizationId,
        caseId: input.caseId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_NOT_APPLIED',
        requiredActions: ['manual_review'],
      });
    }

    return linked(input);
  } catch (error) {
    return failed({
      draftId: input.draftId,
      organizationId: input.organizationId,
      caseId: input.caseId,
      reasonCode: 'REPAIR_INTAKE_DRAFT_LINK_DB_FAILED',
      requiredActions: ['retry_or_manual_review'],
    });
  }
}

function createRepairIntakeDraftRepositoryAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const dbClient = isObject(safeOptions.dbClient) ? safeOptions.dbClient : null;
  const tableName = safeTableName(safeOptions.tableName);
  const now = resolveClock(safeOptions.clock);

  async function markDraftLinkedToCase(input = {}) {
    const normalizedInput = normalizeInput(input);

    if (!isObject(normalizedInput) || normalizedInput.ok !== true) {
      return normalizedInput;
    }

    if (!dbClient) {
      return failed({
        draftId: normalizedInput.draftId,
        organizationId: normalizedInput.organizationId,
        caseId: normalizedInput.caseId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_DB_CLIENT_NOT_CONFIGURED',
        requiredActions: ['configure_db_client'],
      });
    }

    if (!tableName) {
      return failed({
        draftId: normalizedInput.draftId,
        organizationId: normalizedInput.organizationId,
        caseId: normalizedInput.caseId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_REPOSITORY_TABLE_NAME_INVALID',
        requiredActions: ['configure_repository_table'],
      });
    }

    return markWithClient({
      client: dbClientFor(normalizedInput, dbClient),
      tableName,
      input: normalizedInput,
      linkedAt: timestamp(now),
    });
  }

  return {
    markDraftLinkedToCase,
    markLinkedToCase: markDraftLinkedToCase,
  };
}

module.exports = {
  createRepairIntakeDraftRepositoryAdapter,
};
