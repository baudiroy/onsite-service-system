'use strict';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'database_url',
  'databaseurl',
  'db',
  'error',
  'finalappointmentid',
  'handler',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'phone',
  'raw',
  'rawbody',
  'rawdraft',
  'rawinput',
  'rawportoutput',
  'rawrow',
  'rawrows',
  'repository',
  'secret',
  'sql',
  'stack',
  'token',
]);

class RepairIntakeDraftReaderPortAdapterError extends Error {
  constructor(reasonCode, requiredActions = ['configure_draft_repository']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftReaderPortAdapterError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function fieldIsUnsafe(key) {
  return UNSAFE_FIELD_NAMES.has(String(key).toLowerCase());
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeValue(fieldValue);

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

function safeArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
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

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== null),
  );
}

function failureEnvelope(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    id: null,
    draftId: null,
    organizationId: null,
    tenantId: null,
    status: 'failed',
    reasonCode,
    requiredActions,
    summary: null,
  };
}

function createLookup(input) {
  return sanitizeValue(compactObject({
    draftId: firstSafeString(
      input.repairIntakeDraftId,
      input.draftId,
      input.params && input.params.repairIntakeDraftId,
      input.params && input.params.draftId,
    ),
    organizationId: firstSafeString(
      input.organizationId,
      input.context && input.context.organizationId,
    ),
    tenantId: firstSafeString(input.tenantId, input.context && input.context.tenantId),
    requestId: firstSafeString(input.requestId, input.context && input.context.requestId),
    actorId: firstSafeString(
      input.actorId,
      input.actor && input.actor.actorId,
      input.context && input.context.actorId,
    ),
  }));
}

function draftReadFailureEnvelope(draft, fallbackReasonCode, fallbackActions) {
  if (!isObject(draft)) {
    return failureEnvelope(fallbackReasonCode, fallbackActions);
  }

  return sanitizeValue({
    ...failureEnvelope(
      safeString(draft.reasonCode) || fallbackReasonCode,
      safeArray(draft.requiredActions).length > 0 ? safeArray(draft.requiredActions) : fallbackActions,
    ),
    draftId: safeString(draft.draftId) || safeString(draft.id) || null,
    organizationId: safeString(draft.organizationId),
    tenantId: safeString(draft.tenantId),
    status: safeString(draft.status) || 'failed',
  });
}

function draftMatchesLookup(draft, lookup) {
  const draftId = firstSafeString(draft.draftId, draft.id);
  const organizationId = safeString(draft.organizationId);
  const tenantId = safeString(draft.tenantId);

  if (!draftId || !organizationId) {
    return false;
  }

  if (draftId !== lookup.draftId || organizationId !== lookup.organizationId) {
    return false;
  }

  return !lookup.tenantId || tenantId === lookup.tenantId;
}

function draftEnvelope(draft) {
  const draftId = firstSafeString(draft.draftId, draft.id);

  return sanitizeValue({
    ok: true,
    id: draftId,
    draftId,
    organizationId: safeString(draft.organizationId),
    tenantId: safeString(draft.tenantId),
    status: safeString(draft.status) || 'ready',
    source: draft.source,
    sourceRef: draft.sourceRef,
    intakeSource: draft.intakeSource,
    reasonCode: safeString(draft.reasonCode) || 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_READY',
    requiredActions: safeArray(draft.requiredActions),
    summary: draft.summary || null,
  });
}

function createRepairIntakeDraftReaderPortAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const { draftRepository } = safeOptions;

  if (!isObject(draftRepository) || typeof draftRepository.findDraftForConversion !== 'function') {
    throw new RepairIntakeDraftReaderPortAdapterError(
      'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_REPOSITORY_REQUIRED',
      ['configure_draft_repository_find_draft_for_conversion'],
    );
  }

  async function getDraftForConversion(input) {
    if (!isObject(input)) {
      return failureEnvelope(
        'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_INPUT_INVALID',
        ['provide_valid_lookup_input'],
      );
    }

    const lookup = createLookup(sanitizeValue(input));

    if (!safeString(lookup.draftId)) {
      return failureEnvelope(
        'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_INPUT_INVALID',
        ['provide_draft_id'],
      );
    }

    if (!safeString(lookup.organizationId)) {
      return failureEnvelope(
        'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_INPUT_INVALID',
        ['provide_organization_id'],
      );
    }

    try {
      const draft = sanitizeValue(await draftRepository.findDraftForConversion(lookup));

      if (!isObject(draft)) {
        return failureEnvelope(
          'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND',
          ['verify_draft_exists'],
        );
      }

      if (draft.ok === false) {
        return draftReadFailureEnvelope(
          draft,
          'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_READ_FAILED',
          ['retry_or_manual_review'],
        );
      }

      if (!draftMatchesLookup(draft, lookup)) {
        return failureEnvelope(
          'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_SCOPE_MISMATCH',
          ['verify_draft_organization_scope'],
        );
      }

      return draftEnvelope(draft);
    } catch (error) {
      return failureEnvelope('REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_READ_FAILED');
    }
  }

  return {
    getDraftForConversion,
  };
}

module.exports = {
  RepairIntakeDraftReaderPortAdapterError,
  createRepairIntakeDraftReaderPortAdapter,
};
