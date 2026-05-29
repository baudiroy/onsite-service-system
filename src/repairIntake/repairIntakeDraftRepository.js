'use strict';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'caseid',
  'case_id',
  'caseno',
  'case_no',
  'caseref',
  'case_ref',
  'confirmedduplicate',
  'confirmed_duplicate',
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
  'rawdraft',
  'rawinput',
  'rawrow',
  'rawrows',
  'secret',
  'sql',
  'stack',
  'token',
]);

class RepairIntakeDraftRepositoryError extends Error {
  constructor(reasonCode, requiredActions = ['retry_or_manual_review']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftRepositoryError';
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

function safeArray(value) {
  return Array.isArray(value)
    ? sanitizeNestedValue(value).filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function booleanValue(value) {
  return value === true || value === false ? value : undefined;
}

function firstStringFrom(source, keys) {
  if (!isPlainObject(source)) {
    return undefined;
  }

  for (const key of keys) {
    const value = safeString(source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function safeOptionalValue(value) {
  const asString = safeString(value);

  if (asString) {
    return asString;
  }

  if (!isPlainObject(value)) {
    return undefined;
  }

  const sanitized = safeObject(value);

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function firstOptionalValue(source, keys) {
  if (!isPlainObject(source)) {
    return undefined;
  }

  for (const key of keys) {
    const value = safeOptionalValue(source[key]);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function safeDuplicateCandidate(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const candidate = sanitizeNestedValue({
    candidateId: safeString(value.candidateId || value.candidate_id) || undefined,
    candidateRef: safeString(value.candidateRef || value.candidate_ref) || undefined,
    matchScore: typeof value.matchScore === 'number' ? value.matchScore : undefined,
    reasonCode: safeString(value.reasonCode || value.reason_code) || undefined,
    source: safeString(value.source) || undefined,
    sourceRef: safeString(value.sourceRef || value.source_ref) || undefined,
    status: safeString(value.status) || undefined,
  });

  return Object.keys(candidate).length > 0 ? candidate : undefined;
}

function createLookup(input) {
  if (!isPlainObject(input)) {
    throw new RepairIntakeDraftRepositoryError(
      'REPAIR_INTAKE_DRAFT_REPOSITORY_INPUT_INVALID',
      ['provide_valid_lookup_input'],
    );
  }

  const draftId = safeString(input.draftId);

  if (!draftId) {
    throw new RepairIntakeDraftRepositoryError(
      'REPAIR_INTAKE_DRAFT_REPOSITORY_INPUT_INVALID',
      ['provide_draft_id'],
    );
  }

  return {
    actorId: safeString(input.actorId),
    draftId,
    organizationId: safeString(input.organizationId),
    requestId: safeString(input.requestId),
    tenantId: safeString(input.tenantId),
  };
}

function createSelectStatement(lookup) {
  const clauses = ['id = $1'];
  const params = [lookup.draftId];

  if (lookup.organizationId) {
    params.push(lookup.organizationId);
    clauses.push(`organization_id = $${params.length}`);
  }

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
      '    draft_status,',
      '    source,',
      '    source_ref,',
      '    intake_source,',
      '    safe_summary,',
      '    safe_metadata,',
      '    validation_errors_safe',
      'FROM repair_intake_drafts',
      `WHERE ${clauses.join(' AND ')}`,
      'LIMIT 1',
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

function mapDraftRow(row) {
  if (!isPlainObject(row)) {
    return null;
  }

  const metadata = safeObject(row.safe_metadata);
  const summary = safeObject(row.safe_summary);

  return sanitizeNestedValue({
    draftId: safeString(row.id),
    organizationId: safeString(row.organization_id),
    tenantId: safeString(row.tenant_id),
    status: safeString(row.draft_status) || 'ready',
    source: safeString(row.source),
    sourceRef: safeString(row.source_ref),
    intakeSource: safeString(row.intake_source),
    brandId: firstStringFrom(metadata, ['brandId', 'brand_id'])
      || firstStringFrom(summary, ['brandId', 'brand_id']),
    serviceProviderId: firstStringFrom(metadata, ['serviceProviderId', 'service_provider_id', 'providerId', 'provider_id'])
      || firstStringFrom(summary, ['serviceProviderId', 'service_provider_id', 'providerId', 'provider_id']),
    duplicateStatus: firstStringFrom(metadata, ['duplicateStatus', 'duplicate_status', 'dedupeStatus', 'dedupe_status']),
    duplicateCandidate: safeDuplicateCandidate(metadata.duplicateCandidate || metadata.duplicate_candidate),
    reporterRef: firstOptionalValue(metadata, ['reporterRef', 'reporter_ref']),
    customerRef: firstOptionalValue(metadata, ['customerRef', 'customer_ref']),
    billingContactRef: firstOptionalValue(metadata, ['billingContactRef', 'billing_contact_ref']),
    onSiteContactOverrideRef: firstOptionalValue(metadata, ['onSiteContactOverrideRef', 'on_site_contact_override_ref']),
    contactRoleSeparation: firstStringFrom(metadata, [
      'contactRoleSeparation',
      'contact_role_separation',
      'reporterCustomerBillingContactSeparation',
      'reporter_customer_billing_contact_separation',
    ]),
    platformAccepted: booleanValue(metadata.platformAccepted)
      ?? booleanValue(metadata.platform_accepted)
      ?? booleanValue(metadata.humanAccepted)
      ?? booleanValue(metadata.human_accepted),
    importAccepted: booleanValue(metadata.importAccepted)
      ?? booleanValue(metadata.import_accepted)
      ?? booleanValue(metadata.stagingAccepted)
      ?? booleanValue(metadata.staging_accepted),
    summary,
    metadata,
    warnings: safeArray(row.validation_errors_safe),
  });
}

function assertDbClient(dbClient) {
  if (!dbClient || typeof dbClient !== 'object' || typeof dbClient.query !== 'function') {
    throw new RepairIntakeDraftRepositoryError(
      'REPAIR_INTAKE_DRAFT_REPOSITORY_DB_CLIENT_REQUIRED',
      ['provide_injected_query_client'],
    );
  }
}

function createRepairIntakeDraftRepository(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const { dbClient } = safeOptions;

  assertDbClient(dbClient);

  async function findDraftForConversion(input) {
    const lookup = createLookup(sanitizeNestedValue(input));
    const statement = createSelectStatement(lookup);

    try {
      const result = await dbClient.query(statement.text, statement.params);
      const [row] = resolveRows(result);

      return mapDraftRow(row);
    } catch (error) {
      throw new RepairIntakeDraftRepositoryError(
        'REPAIR_INTAKE_DRAFT_REPOSITORY_QUERY_FAILED',
        ['retry_or_manual_review'],
      );
    }
  }

  return {
    findDraftForConversion,
  };
}

module.exports = {
  RepairIntakeDraftRepositoryError,
  createRepairIntakeDraftRepository,
};
