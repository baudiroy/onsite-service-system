'use strict';

const DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND = 'depot_workshop.depot_intake_sql_repository_adapter';

const READ_DEPOT_INTAKE_BY_DRAFT_QUERY_NAME = 'depotWorkshopReadDepotIntakeByDraft';

const DEPOT_WORKFLOW_TYPES = new Set([
  'depot',
  'carry_in',
  'mail_in',
  'pickup_delivery',
]);

const FORBIDDEN_SAFE_FIELD_KEYS = new Set([
  'address',
  'authorization',
  'completionreport',
  'completion_report',
  'cookie',
  'customer',
  'customeraddress',
  'customer_address',
  'customerdata',
  'customer_data',
  'customername',
  'customer_name',
  'customerphone',
  'customer_phone',
  'databaseurl',
  'database_url',
  'db',
  'error',
  'fieldservicereport',
  'field_service_report',
  'finalappointmentid',
  'final_appointment_id',
  'headers',
  'lineaccesstoken',
  'line_access_token',
  'lineuserid',
  'line_user_id',
  'params',
  'phone',
  'providerpayload',
  'provider_payload',
  'raw',
  'rawbody',
  'raw_body',
  'rawinput',
  'raw_input',
  'rawpayload',
  'raw_payload',
  'rawrow',
  'raw_row',
  'rawrows',
  'raw_rows',
  'secret',
  'sql',
  'stack',
  'token',
]);

const READ_DEPOT_INTAKE_BY_DRAFT_SQL = [
  'SELECT',
  '  id,',
  '  organization_id,',
  '  tenant_id,',
  '  draft_status,',
  '  source,',
  '  source_ref,',
  '  intake_source,',
  '  safe_summary,',
  '  safe_metadata,',
  '  validation_status,',
  '  validation_errors_safe,',
  '  created_at,',
  '  updated_at',
  'FROM repair_intake_drafts',
  'WHERE id = $1::uuid',
  '  AND organization_id = $2::uuid',
  '  AND ($3::uuid IS NULL OR tenant_id = $3::uuid)',
  'LIMIT 1',
].join('\n');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function normalizedKey(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function keyIsForbidden(key) {
  return FORBIDDEN_SAFE_FIELD_KEYS.has(normalizedKey(key));
}

function sanitizeSafeValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeSafeValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !keyIsForbidden(key))
        .map(([key, item]) => [key, sanitizeSafeValue(item)])
        .filter(([, item]) => item !== undefined),
    );
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

function safeObject(value) {
  return isObject(value) ? sanitizeSafeValue(value) : {};
}

function safeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return sanitizeSafeValue(value)
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function firstStringFrom(source, keys) {
  if (!isObject(source)) {
    return undefined;
  }

  for (const key of keys) {
    const value = stringValue(source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function firstStringAcross(sources, keys) {
  for (const source of sources) {
    const value = firstStringFrom(source, keys);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function toIso(value) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : stringValue(value) || null;
}

function freezeQuerySpec(spec) {
  Object.freeze(spec.values);

  return Object.freeze(spec);
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    found: false,
    written: false,
    adapterKind: DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND,
    reasonCode,
    requestId: stringValue(context.requestId),
  });
}

function readSuccess(depotIntake, context = {}) {
  return compactRecord({
    ok: true,
    found: true,
    written: false,
    adapterKind: DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND,
    reasonCode: 'depot_intake_read_succeeded',
    requestId: stringValue(context.requestId),
    depotIntake,
  });
}

function resolveQueryExecutor(dbClient) {
  if (!isObject(dbClient)) {
    return undefined;
  }

  if (typeof dbClient.query === 'function') {
    return dbClient.query.bind(dbClient);
  }

  if (typeof dbClient.execute === 'function') {
    return dbClient.execute.bind(dbClient);
  }

  return undefined;
}

function executeQuery(dbClient, querySpec) {
  const query = resolveQueryExecutor(dbClient);

  if (typeof query !== 'function') {
    throw new Error('query_executor_required');
  }

  return query(querySpec);
}

function resultRecords(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

function resultFailed(result) {
  return isObject(result) && (
    result.ok === false
    || result.success === false
    || result.error !== undefined
  );
}

function validateReadInput(input) {
  const source = isObject(input) ? input : {};
  const draftId = stringValue(source.draftId || source.draft_id || source.intakeDraftId);
  const organizationId = stringValue(source.organizationId || source.organization_id);
  const tenantId = stringValue(source.tenantId || source.tenant_id);
  const brandId = stringValue(source.brandId || source.brand_id);
  const serviceProviderId = stringValue(source.serviceProviderId || source.service_provider_id || source.providerId);
  const subcontractorId = stringValue(source.subcontractorId || source.subcontractor_id);
  const requestId = stringValue(source.requestId || source.request_id);

  if (!draftId) {
    return { ok: false, reasonCode: 'depot_intake_draft_id_required', requestId };
  }

  if (!organizationId) {
    return { ok: false, reasonCode: 'organization_id_required', requestId };
  }

  if (subcontractorId) {
    return { ok: false, reasonCode: 'depot_intake_subcontractor_scope_not_supported', requestId };
  }

  return {
    ok: true,
    draftId,
    organizationId,
    tenantId,
    brandId,
    serviceProviderId,
    requestId,
  };
}

function buildReadSpec(validation) {
  return freezeQuerySpec({
    name: READ_DEPOT_INTAKE_BY_DRAFT_QUERY_NAME,
    text: READ_DEPOT_INTAKE_BY_DRAFT_SQL,
    values: [
      validation.draftId,
      validation.organizationId,
      validation.tenantId || null,
    ],
  });
}

function workflowTypeFrom(row, summary, metadata) {
  return firstStringAcross([metadata, summary, row], [
    'workflowType',
    'workflow_type',
  ]) || firstStringAcross([metadata, summary, row], [
    'serviceType',
    'service_type',
  ]);
}

function depotIntakeFromRecord(record) {
  if (!isObject(record)) {
    return undefined;
  }

  const summary = safeObject(record.safe_summary);
  const metadata = safeObject(record.safe_metadata);
  const workflowType = workflowTypeFrom(record, summary, metadata);

  if (!workflowType || !DEPOT_WORKFLOW_TYPES.has(workflowType)) {
    return undefined;
  }

  return compactRecord({
    draftId: stringValue(record.id),
    organizationId: stringValue(record.organization_id),
    tenantId: stringValue(record.tenant_id) || null,
    draftStatus: stringValue(record.draft_status) || null,
    source: stringValue(record.source) || null,
    sourceRef: stringValue(record.source_ref) || null,
    intakeSource: stringValue(record.intake_source) || null,
    workflowType,
    serviceType: workflowType,
    brandId: firstStringAcross([metadata, summary], ['brandId', 'brand_id']) || null,
    serviceProviderId: firstStringAcross([metadata, summary], [
      'serviceProviderId',
      'service_provider_id',
      'providerId',
      'provider_id',
    ]) || null,
    itemRef: firstStringAcross([metadata, summary], ['itemRef', 'item_ref', 'repairItemRef', 'repair_item_ref']) || null,
    productRef: firstStringAcross([metadata, summary], ['productRef', 'product_ref']) || null,
    modelRef: firstStringAcross([metadata, summary], ['modelRef', 'model_ref']) || null,
    serialRef: firstStringAcross([metadata, summary], ['serialRef', 'serial_ref']) || null,
    issueSummaryRef: firstStringAcross([metadata, summary], ['issueSummaryRef', 'issue_summary_ref']) || null,
    depotStatus: firstStringAcross([metadata, summary], ['depotStatus', 'depot_status', 'repairStatus', 'repair_status']) || null,
    receivedAt: toIso(firstStringAcross([metadata, summary], ['receivedAt', 'received_at'])),
    returnMethod: firstStringAcross([metadata, summary], ['returnMethod', 'return_method']) || null,
    validationStatus: stringValue(record.validation_status) || null,
    warnings: safeArray(record.validation_errors_safe),
    createdAt: toIso(record.created_at),
    updatedAt: toIso(record.updated_at),
  });
}

function scopeMatches(depotIntake, validation) {
  if (!depotIntake) {
    return false;
  }

  if (depotIntake.organizationId !== validation.organizationId) {
    return false;
  }

  if (validation.tenantId && depotIntake.tenantId !== validation.tenantId) {
    return false;
  }

  if (validation.brandId && depotIntake.brandId !== validation.brandId) {
    return false;
  }

  if (validation.serviceProviderId && depotIntake.serviceProviderId !== validation.serviceProviderId) {
    return false;
  }

  return true;
}

function normalizeReadResult(result, validation) {
  if (resultFailed(result)) {
    return failure('depot_intake_read_failed', validation);
  }

  const [record] = resultRecords(result);
  const depotIntake = depotIntakeFromRecord(record);

  if (!scopeMatches(depotIntake, validation)) {
    return failure('depot_intake_not_found_or_denied', validation);
  }

  return readSuccess(depotIntake, validation);
}

function createDepotIntakeSqlRepositoryAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const dbClient = source.dbClient;

  return {
    kind: DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND,

    async findDepotIntakeState(input = {}) {
      if (!resolveQueryExecutor(dbClient)) {
        return failure('db_client_required', input);
      }

      const validation = validateReadInput(input);

      if (!validation.ok) {
        return failure(validation.reasonCode, validation);
      }

      try {
        const result = await executeQuery(dbClient, buildReadSpec(validation));

        return normalizeReadResult(result, validation);
      } catch (caught) {
        return failure('depot_intake_read_failed', validation);
      }
    },

    async recordDepotIntakeIntent(input = {}) {
      return failure('depot_intake_write_scope_not_approved', input);
    },
  };
}

module.exports = {
  DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND,
  DEPOT_WORKFLOW_TYPES,
  createDepotIntakeSqlRepositoryAdapter,
};
