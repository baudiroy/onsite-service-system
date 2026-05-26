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

function sanitizeSafeObject(value) {
  if (!isObject(value) || hasForbiddenInputField(value)) {
    return null;
  }

  return { ...value };
}

function normalizeSource(value) {
  const source = stringValue(value);

  if (!source) {
    return null;
  }

  const normalized = source.toLowerCase();
  const sourceMap = new Map([
    ['web', 'website'],
    ['website', 'website'],
    ['open_web', 'website'],
    ['api', 'api'],
    ['brand_api', 'api'],
    ['partner_api', 'api'],
    ['phone', 'phone'],
    ['call', 'phone'],
    ['ai_call', 'phone'],
    ['line', 'line'],
    ['official_line', 'line'],
    ['admin', 'admin'],
    ['manual', 'admin'],
    ['agent_assisted', 'admin'],
    ['email', 'email'],
    ['whatsapp', 'whatsapp'],
    ['facebook', 'facebook'],
    ['instagram', 'instagram'],
  ]);

  return sourceMap.get(normalized) || null;
}

function normalizeCaseType(value) {
  const caseType = stringValue(value);

  if (!caseType) {
    return 'repair';
  }

  const normalized = caseType.toLowerCase();
  const caseTypeMap = new Map([
    ['onsite', 'repair'],
    ['field_service', 'repair'],
    ['repair', 'repair'],
    ['installation', 'installation'],
    ['maintenance', 'maintenance'],
    ['inspection', 'inspection'],
    ['return', 'return'],
    ['warranty', 'warranty'],
    ['other', 'other'],
  ]);

  return caseTypeMap.get(normalized) || null;
}

function sanitizeCandidate(candidate) {
  if (!isObject(candidate)) {
    return null;
  }

  const sourceDraftId = stringValue(candidate.sourceDraftId);
  const organizationId = stringValue(candidate.organizationId);
  const customerId = stringValue(candidate.customerId || candidate.customer_id);
  const brand = stringValue(candidate.brand);
  const productType = stringValue(candidate.productType || candidate.product_type);
  const modelNo = stringValue(candidate.modelNo || candidate.model_no);
  const problemDescription = stringValue(candidate.problemDescription || candidate.problem_description);
  const source = normalizeSource(candidate.source || candidate.intakeSource);

  if (!sourceDraftId || !organizationId) {
    return null;
  }

  return {
    sourceDraftId,
    organizationId,
    brand,
    caseNo: stringValue(candidate.caseNo || candidate.case_no) || null,
    caseType: normalizeCaseType(candidate.caseType || candidate.case_type || candidate.serviceType),
    customerId,
    customerSnapshot: sanitizeSafeObject(candidate.customerSnapshot || candidate.customer_snapshot),
    metadata: sanitizeSafeObject(candidate.metadata),
    modelNo,
    problemDescription,
    productType,
    priority: stringValue(candidate.priority) || 'normal',
    serviceRegion: stringValue(candidate.serviceRegion || candidate.service_region) || null,
    source,
    reporterRef: sanitizeRef(candidate.reporterRef),
    customerRef: sanitizeRef(candidate.customerRef),
    billingContactRef: sanitizeRef(candidate.billingContactRef),
    siteRef: sanitizeRef(candidate.siteRef),
    issueSummaryRef: sanitizeRef(candidate.issueSummaryRef),
    createdBy: stringValue(candidate.createdBy || candidate.created_by || candidate.createdByUserId) || null,
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

  for (const [fieldName, reasonCode, requiredActions] of [
    ['customerId', 'REPAIR_INTAKE_CASE_REPOSITORY_CUSTOMER_ID_MISSING', ['provide_resolved_customer_id']],
    ['source', 'REPAIR_INTAKE_CASE_REPOSITORY_SOURCE_UNSUPPORTED', ['provide_supported_case_source']],
    ['brand', 'REPAIR_INTAKE_CASE_REPOSITORY_BRAND_MISSING', ['provide_case_brand']],
    ['productType', 'REPAIR_INTAKE_CASE_REPOSITORY_PRODUCT_TYPE_MISSING', ['provide_product_type']],
    ['modelNo', 'REPAIR_INTAKE_CASE_REPOSITORY_MODEL_NO_MISSING', ['provide_model_no']],
    ['problemDescription', 'REPAIR_INTAKE_CASE_REPOSITORY_PROBLEM_DESCRIPTION_MISSING', ['provide_problem_description']],
    ['caseType', 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_TYPE_UNSUPPORTED', ['provide_supported_case_type']],
  ]) {
    if (!candidate[fieldName]) {
      return blocked({
        organizationId: candidate.organizationId,
        sourceDraftId: candidate.sourceDraftId,
        reasonCode,
        requiredActions,
      });
    }
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

function resolveCaseNumberGenerator(caseNumberGenerator) {
  if (typeof caseNumberGenerator === 'function') {
    return caseNumberGenerator;
  }

  if (isObject(caseNumberGenerator) && typeof caseNumberGenerator.next === 'function') {
    return caseNumberGenerator.next.bind(caseNumberGenerator);
  }

  if (isObject(caseNumberGenerator) && typeof caseNumberGenerator.generate === 'function') {
    return caseNumberGenerator.generate.bind(caseNumberGenerator);
  }

  return undefined;
}

function payloadFor({ id, candidate, command, createdAt }) {
  return {
    id,
    sourceDraftId: candidate.sourceDraftId,
    case_no: candidate.caseNo,
    customer_id: candidate.customerId,
    organization_id: candidate.organizationId,
    status: 'draft',
    priority: candidate.priority,
    source: candidate.source,
    brand: candidate.brand,
    case_type: candidate.caseType,
    product_type: candidate.productType,
    model_no: candidate.modelNo,
    problem_description: candidate.problemDescription,
    service_region: candidate.serviceRegion,
    customer_snapshot: candidate.customerSnapshot,
    metadata: candidate.metadata,
    created_at: createdAt,
    created_by: candidate.createdBy,
  };
}

function queryText(tableName) {
  return [
    `insert into ${tableName} (`,
    'id, case_no, customer_id, organization_id, status, priority,',
    'source, brand, case_type, product_type, model_no, problem_description,',
    'service_region, customer_snapshot, metadata, created_at, created_by',
    ') values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16, $17)',
  ].join(' ');
}

function queryValues(payload) {
  return [
    payload.id,
    payload.case_no,
    payload.customer_id,
    payload.organization_id,
    payload.status,
    payload.priority,
    payload.source,
    payload.brand,
    payload.case_type,
    payload.product_type,
    payload.model_no,
    payload.problem_description,
    payload.service_region,
    payload.customer_snapshot ? JSON.stringify(payload.customer_snapshot) : null,
    payload.metadata ? JSON.stringify(payload.metadata) : null,
    payload.created_at,
    payload.created_by,
  ];
}

function dbClientFor(input, baseClient) {
  return input.tx || baseClient;
}

function noRowsAffected(result) {
  return isObject(result) && Number.isInteger(result.rowCount) && result.rowCount < 1;
}

async function createWithClient({ client, tableName, payload }) {
  if (!isObject(client)) {
    return failed({
      id: payload.id,
      organizationId: payload.organization_id,
      sourceDraftId: payload.sourceDraftId,
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
        sourceDraftId: payload.sourceDraftId,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_DB_CLIENT_UNSUPPORTED',
        requiredActions: ['configure_db_client'],
      });
    }

    if (noRowsAffected(result)) {
      return failed({
        id: payload.id,
        organizationId: payload.organization_id,
        sourceDraftId: payload.sourceDraftId,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    if (isObject(result) && result.ok === false) {
      return failed({
        id: payload.id,
        organizationId: payload.organization_id,
        sourceDraftId: payload.sourceDraftId,
        reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }

    return created({
      id: payload.id,
      organizationId: payload.organization_id,
      sourceDraftId: payload.sourceDraftId,
    });
  } catch (error) {
    return failed({
      id: payload.id,
      organizationId: payload.organization_id,
      sourceDraftId: payload.sourceDraftId,
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
  const generateCaseNo = resolveCaseNumberGenerator(safeOptions.caseNumberGenerator);

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

    if (!caseCandidate.caseNo) {
      if (!generateCaseNo) {
        return failed({
          id,
          organizationId: caseCandidate.organizationId,
          sourceDraftId: caseCandidate.sourceDraftId,
          reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_NO_GENERATOR_NOT_CONFIGURED',
          requiredActions: ['configure_case_no_generator'],
        });
      }

      try {
        caseCandidate.caseNo = stringValue(await generateCaseNo({
          organizationId: caseCandidate.organizationId,
          source: caseCandidate.source,
          sourceDraftId: caseCandidate.sourceDraftId,
        })) || null;
      } catch (error) {
        return failed({
          id,
          organizationId: caseCandidate.organizationId,
          sourceDraftId: caseCandidate.sourceDraftId,
          reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_NO_GENERATION_FAILED',
          requiredActions: ['retry_or_manual_review'],
        });
      }

      if (!caseCandidate.caseNo) {
        return blocked({
          id,
          organizationId: caseCandidate.organizationId,
          sourceDraftId: caseCandidate.sourceDraftId,
          reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CASE_NO_MISSING',
          requiredActions: ['provide_case_no'],
        });
      }
    }

    const payload = payloadFor({
      id,
      candidate: caseCandidate,
      command,
      createdAt: timestamp(now) || new Date().toISOString(),
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
