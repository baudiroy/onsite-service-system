'use strict';

const DEFAULT_TABLE_NAME = 'cases';

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

function blocked({ id = null, organizationId = null, sourceDraftId = null, reasonCode, requiredActions }) {
  return {
    ok: false,
    id,
    organizationId,
    sourceDraftId,
    status: 'blocked',
    reasonCode,
    requiredActions,
  };
}

function failed({ id = null, organizationId = null, sourceDraftId = null, reasonCode, requiredActions }) {
  return {
    ok: false,
    id,
    organizationId,
    sourceDraftId,
    status: 'failed',
    reasonCode,
    requiredActions,
  };
}

function created({ id, organizationId, sourceDraftId }) {
  return {
    id,
    organizationId,
    sourceDraftId,
    status: 'created',
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

function sanitizeCommand(command) {
  if (!isObject(command)) {
    return null;
  }

  const draftId = stringValue(command.draftId);
  const organizationId = stringValue(command.organizationId);

  if (!draftId || !organizationId) {
    return null;
  }

  return {
    draftId,
    organizationId,
    actorId: stringValue(command.actorId) || null,
    requestId: stringValue(command.requestId) || null,
    idempotencyKey: stringValue(command.idempotencyKey) || null,
  };
}

function sanitizeRef(value) {
  if (!isObject(value)) {
    return null;
  }

  const sanitized = {};

  for (const key of [
    'id',
    'refId',
    'referenceId',
    'type',
    'role',
    'source',
    'sourceRef',
    'externalRef',
    'reviewStatus',
  ]) {
    const refValue = stringValue(value[key]);

    if (refValue) {
      sanitized[key] = refValue;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function sanitizeCandidate(candidate) {
  if (!isObject(candidate)) {
    return null;
  }

  const sourceDraftId = stringValue(candidate.sourceDraftId);
  const organizationId = stringValue(candidate.organizationId);
  const intakeSource = stringValue(candidate.intakeSource);

  if (!sourceDraftId || !organizationId || !intakeSource) {
    return null;
  }

  return {
    sourceDraftId,
    organizationId,
    brandId: stringValue(candidate.brandId) || null,
    serviceProviderId: stringValue(candidate.serviceProviderId) || null,
    intakeSource,
    serviceType: stringValue(candidate.serviceType) || null,
    priority: stringValue(candidate.priority) || null,
    reporterRef: sanitizeRef(candidate.reporterRef),
    customerRef: sanitizeRef(candidate.customerRef),
    billingContactRef: sanitizeRef(candidate.billingContactRef),
    siteRef: sanitizeRef(candidate.siteRef),
    issueSummaryRef: sanitizeRef(candidate.issueSummaryRef),
    createdByActorId: stringValue(candidate.createdByActorId) || null,
  };
}

function inputCandidate(input) {
  return isObject(input.caseCandidate) ? input.caseCandidate : input;
}

function normalizeInput(input) {
  if (!isObject(input)) {
    return blocked({
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_INPUT_MISSING',
      requiredActions: ['provide_case_candidate'],
    });
  }

  if (hasForbiddenInputField(input)) {
    return blocked({
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_UNSAFE_INPUT',
      requiredActions: ['provide_sanitized_case_candidate'],
    });
  }

  const candidate = sanitizeCandidate(inputCandidate(input));

  if (!candidate) {
    return blocked({
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CANDIDATE_MISSING',
      requiredActions: ['provide_sanitized_case_candidate'],
    });
  }

  const command = sanitizeCommand(input.command);

  if (command && command.organizationId !== candidate.organizationId) {
    return blocked({
      organizationId: candidate.organizationId,
      sourceDraftId: candidate.sourceDraftId,
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_ORGANIZATION_MISMATCH',
      requiredActions: ['manual_review'],
    });
  }

  if (command && command.draftId !== candidate.sourceDraftId) {
    return blocked({
      organizationId: candidate.organizationId,
      sourceDraftId: candidate.sourceDraftId,
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_SOURCE_DRAFT_MISMATCH',
      requiredActions: ['manual_review'],
    });
  }

  return {
    ok: true,
    command,
    caseCandidate: candidate,
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

function resolveIdGenerator(idGenerator) {
  if (typeof idGenerator === 'function') {
    return idGenerator;
  }

  if (isObject(idGenerator) && typeof idGenerator.generate === 'function') {
    return idGenerator.generate.bind(idGenerator);
  }

  if (isObject(idGenerator) && typeof idGenerator.next === 'function') {
    return idGenerator.next.bind(idGenerator);
  }

  return undefined;
}

function payloadFor({ id, candidate, command, createdAt }) {
  return {
    id,
    organization_id: candidate.organizationId,
    source_repair_intake_draft_id: candidate.sourceDraftId,
    brand_id: candidate.brandId,
    service_provider_id: candidate.serviceProviderId,
    intake_source: candidate.intakeSource,
    service_type: candidate.serviceType,
    priority: candidate.priority,
    status: 'created',
    created_by_actor_id: candidate.createdByActorId || (command && command.actorId) || null,
    created_at: createdAt,
    request_id: command ? command.requestId : null,
    idempotency_key: command ? command.idempotencyKey : null,
  };
}

function queryText(tableName) {
  return [
    `insert into ${tableName} (`,
    'id, organization_id, source_repair_intake_draft_id, brand_id, service_provider_id,',
    'intake_source, service_type, priority, status, created_by_actor_id,',
    'created_at, request_id, idempotency_key',
    ') values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
  ].join(' ');
}

function queryValues(payload) {
  return [
    payload.id,
    payload.organization_id,
    payload.source_repair_intake_draft_id,
    payload.brand_id,
    payload.service_provider_id,
    payload.intake_source,
    payload.service_type,
    payload.priority,
    payload.status,
    payload.created_by_actor_id,
    payload.created_at,
    payload.request_id,
    payload.idempotency_key,
  ];
}

function dbClientFor(input, baseClient) {
  return input.tx || baseClient;
}

async function createWithClient({ client, tableName, payload }) {
  if (!isObject(client)) {
    return failed({
      id: payload.id,
      organizationId: payload.organization_id,
      sourceDraftId: payload.source_repair_intake_draft_id,
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_DB_CLIENT_NOT_CONFIGURED',
      requiredActions: ['configure_db_client'],
    });
  }

  try {
    let result;

    if (typeof client.insert === 'function') {
      result = await client.insert(tableName, payload);
    } else if (typeof client.query === 'function') {
      result = await client.query(queryText(tableName), queryValues(payload));
    } else if (typeof client.execute === 'function') {
      result = await client.execute(queryText(tableName), queryValues(payload));
    } else {
      return failed({
        id: payload.id,
        organizationId: payload.organization_id,
        sourceDraftId: payload.source_repair_intake_draft_id,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_DB_CLIENT_UNSUPPORTED',
        requiredActions: ['configure_db_client'],
      });
    }

    if (isObject(result) && result.ok === false) {
      return failed({
        id: payload.id,
        organizationId: payload.organization_id,
        sourceDraftId: payload.source_repair_intake_draft_id,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    return created({
      id: payload.id,
      organizationId: payload.organization_id,
      sourceDraftId: payload.source_repair_intake_draft_id,
    });
  } catch (error) {
    return failed({
      id: payload.id,
      organizationId: payload.organization_id,
      sourceDraftId: payload.source_repair_intake_draft_id,
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
      requiredActions: ['retry_or_manual_review'],
    });
  }
}

function createRepairIntakeCaseRepositoryAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const dbClient = isObject(safeOptions.dbClient) ? safeOptions.dbClient : null;
  const tableName = safeTableName(safeOptions.tableName);
  const now = resolveClock(safeOptions.clock);
  const generateId = resolveIdGenerator(safeOptions.idGenerator);

  async function createCaseFromRepairIntakeCandidate(input = {}) {
    const normalizedInput = normalizeInput(input);

    if (!isObject(normalizedInput) || normalizedInput.ok !== true) {
      return normalizedInput;
    }

    const { caseCandidate, command } = normalizedInput;

    if (!dbClient) {
      return failed({
        organizationId: caseCandidate.organizationId,
        sourceDraftId: caseCandidate.sourceDraftId,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_DB_CLIENT_NOT_CONFIGURED',
        requiredActions: ['configure_db_client'],
      });
    }

    if (!tableName) {
      return failed({
        organizationId: caseCandidate.organizationId,
        sourceDraftId: caseCandidate.sourceDraftId,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_TABLE_NAME_INVALID',
        requiredActions: ['configure_repository_table'],
      });
    }

    if (!generateId) {
      return failed({
        organizationId: caseCandidate.organizationId,
        sourceDraftId: caseCandidate.sourceDraftId,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_ID_GENERATOR_NOT_CONFIGURED',
        requiredActions: ['configure_id_generator'],
      });
    }

    let id;

    try {
      id = stringValue(await generateId({
        organizationId: caseCandidate.organizationId,
        sourceDraftId: caseCandidate.sourceDraftId,
      }));
    } catch (error) {
      return failed({
        organizationId: caseCandidate.organizationId,
        sourceDraftId: caseCandidate.sourceDraftId,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_ID_GENERATION_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    if (!id) {
      return blocked({
        organizationId: caseCandidate.organizationId,
        sourceDraftId: caseCandidate.sourceDraftId,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_ID_MISSING',
        requiredActions: ['provide_case_id_generator'],
      });
    }

    const payload = payloadFor({
      id,
      candidate: caseCandidate,
      command,
      createdAt: timestamp(now),
    });

    return createWithClient({
      client: dbClientFor(normalizedInput, dbClient),
      tableName,
      payload,
    });
  }

  return {
    createCaseFromRepairIntakeCandidate,
    create: createCaseFromRepairIntakeCandidate,
  };
}

module.exports = {
  createRepairIntakeCaseRepositoryAdapter,
};
