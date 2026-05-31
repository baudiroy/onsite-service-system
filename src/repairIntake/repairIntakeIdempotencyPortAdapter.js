'use strict';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'ai',
  'authorization',
  'auditinternals',
  'bil' + 'ling',
  'caseId',
  'caseid',
  'case_id',
  'cookie',
  'customeraddress',
  'customername',
  'customerphone',
  'database_url',
  'databaseurl',
  'db',
  'error',
  'finalAppointmentId',
  'finalappointmentid',
  'final_appointment_id',
  'handler',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'phone',
  'password',
  'pro' + 'vider',
  'pro' + 'viderpayload',
  'raw',
  'rawbody',
  'rawrequestbody',
  'rawresult',
  'rawrows',
  'rag',
  'secret',
  'sql',
  'stack',
  'token',
]);

class RepairIntakeIdempotencyPortAdapterError extends Error {
  constructor(reasonCode, requiredActions = ['configure_idempotency_store']) {
    super(reasonCode);
    this.name = 'RepairIntakeIdempotencyPortAdapterError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

function safeArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
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

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== null),
  );
}

function createFailure(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    action: 'repair_intake_draft_to_case_submit',
    draftId: null,
    organizationId: null,
    tenantId: null,
    status: 'not_found',
    submitted: false,
    reasonCode,
    requiredActions,
    plan: null,
    caseRef: null,
    auditEvent: null,
  };
}

function createLookupInput(input) {
  return sanitizeValue(compactObject({
    idempotencyKey: firstSafeString(input.idempotencyKey),
    draftId: firstSafeString(input.repairIntakeDraftId, input.draftId),
    organizationId: firstSafeString(input.organizationId),
    tenantId: firstSafeString(input.tenantId),
    requestId: firstSafeString(input.requestId),
    safeRequestFingerprint: firstSafeString(input.safeRequestFingerprint, input.requestFingerprint),
    actor: sanitizeValue(input.actor),
    metadata: sanitizeValue(input.metadata),
  }));
}

function createRecordInput(input) {
  return sanitizeValue(compactObject({
    idempotencyKey: firstSafeString(input.idempotencyKey),
    draftId: firstSafeString(input.repairIntakeDraftId, input.draftId),
    organizationId: firstSafeString(input.organizationId),
    tenantId: firstSafeString(input.tenantId),
    requestId: firstSafeString(input.requestId),
    safeRequestFingerprint: firstSafeString(input.safeRequestFingerprint, input.requestFingerprint),
    actor: sanitizeValue(input.actor),
    result: sanitizeValue(input.result),
    caseRef: sanitizeValue(input.caseRef),
    metadata: sanitizeValue(input.metadata),
  }));
}

function noExistingResultEnvelope(input) {
  return sanitizeValue(compactObject({
    ok: false,
    action: 'repair_intake_draft_to_case_submit',
    draftId: firstSafeString(input.draftId),
    organizationId: firstSafeString(input.organizationId),
    tenantId: firstSafeString(input.tenantId),
    status: 'not_found',
    submitted: false,
    reasonCode: 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_NO_EXISTING_RESULT',
    requiredActions: [],
    plan: null,
    caseRef: null,
    auditEvent: null,
  }));
}

function replayResult(input, existingResult) {
  return sanitizeValue(compactObject({
    ok: true,
    action: existingResult.action || 'repair_intake_draft_to_case_submit',
    idempotencyKey: firstSafeString(existingResult.idempotencyKey, input.idempotencyKey),
    draftId: firstSafeString(existingResult.draftId, input.draftId),
    organizationId: firstSafeString(existingResult.organizationId, input.organizationId),
    tenantId: firstSafeString(existingResult.tenantId, input.tenantId),
    status: safeString(existingResult.status) || 'submitted',
    submitted: existingResult.submitted !== false,
    reasonCode: safeString(existingResult.reasonCode)
      || 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_REPLAY_READY',
    requiredActions: safeArray(existingResult.requiredActions),
    plan: sanitizeValue(existingResult.plan),
    caseRef: sanitizeValue(existingResult.caseRef),
    auditEvent: sanitizeValue(existingResult.auditEvent),
  }));
}

function recordEnvelope(input, storedResult) {
  return sanitizeValue(compactObject({
    ok: true,
    action: 'repair_intake_draft_to_case_submit',
    idempotencyKey: firstSafeString(storedResult.idempotencyKey, input.idempotencyKey),
    draftId: firstSafeString(storedResult.draftId, input.draftId),
    organizationId: firstSafeString(storedResult.organizationId, input.organizationId),
    tenantId: firstSafeString(storedResult.tenantId, input.tenantId),
    status: safeString(storedResult.status) || 'recorded',
    submitted: storedResult.submitted !== false,
    reasonCode: safeString(storedResult.reasonCode)
      || 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORDED',
    requiredActions: safeArray(storedResult.requiredActions),
    plan: sanitizeValue(storedResult.plan),
    caseRef: sanitizeValue(storedValueCaseRef(storedResult.caseRef, input)),
    auditEvent: sanitizeValue(storedResult.auditEvent),
    recordId: safeString(storedResult.recordId)
      || safeString(storedResult.id)
      || safeString(storedResult.metadata && storedResult.metadata.recordId)
      || null,
  }));
}

function storedValueCaseRef(storedCaseRef, input) {
  if (isObject(storedCaseRef) || isObject(input && input.caseRef)) {
    return sanitizeValue(storedCaseRef || input.caseRef);
  }

  if (isObject(input && input.result && input.result.caseRef)) {
    return sanitizeValue(input.result.caseRef);
  }

  return null;
}

function ensureSafeLookupKeys(lookup) {
  for (const key of ['idempotencyKey', 'draftId', 'organizationId']) {
    if (!safeString(lookup[key])) {
      return false;
    }
  }

  return true;
}

function ensureStoreResult(input) {
  if (!isObject(input) || (!input.ok && !input.result && !input.action && !input.submitted)) {
    return false;
  }

  return true;
}

function scopedResultMatchesContext(result, context) {
  if (!isObject(result)) {
    return false;
  }

  for (const key of ['idempotencyKey', 'draftId', 'organizationId']) {
    if (safeString(result[key]) !== safeString(context[key])) {
      return false;
    }
  }

  if (safeString(context.tenantId) && safeString(result.tenantId) !== safeString(context.tenantId)) {
    return false;
  }

  return true;
}

function createRepairIntakeIdempotencyPortAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const { idempotencyStore } = safeOptions;

  if (!isObject(idempotencyStore)
    || typeof idempotencyStore.findExistingDraftToCaseResult !== 'function'
    || typeof idempotencyStore.recordDraftToCaseResult !== 'function') {
    throw new RepairIntakeIdempotencyPortAdapterError(
      'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_STORE_REQUIRED',
      ['configure_idempotency_store_methods'],
    );
  }

  async function findExistingDraftToCaseResult(input) {
    if (!isObject(input)) {
      return createFailure('REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID', [
        'provide_plain_object_input',
      ]);
    }

    const lookup = createLookupInput(input);

    if (!ensureSafeLookupKeys(lookup)) {
      return createFailure(
        'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID',
        ['provide_idempotency_lookup_context'],
      );
    }

    try {
      const existingResult = sanitizeValue(await idempotencyStore.findExistingDraftToCaseResult(lookup));

      if (!ensureStoreResult(existingResult)) {
        return noExistingResultEnvelope(lookup);
      }

      if (!scopedResultMatchesContext(existingResult, lookup)) {
        return createFailure(
          'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_SCOPE_MISMATCH',
          ['verify_idempotency_scope'],
        );
      }

      return replayResult(lookup, existingResult);
    } catch (error) {
      return createFailure('REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_FIND_FAILED');
    }
  }

  async function recordDraftToCaseResult(input) {
    if (!isObject(input)) {
      return createFailure('REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID', [
        'provide_plain_object_input',
      ]);
    }

    const recordInput = createRecordInput(input);

    if (!ensureSafeLookupKeys(recordInput)) {
      return createFailure(
        'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID',
        ['provide_idempotency_record_context'],
      );
    }

    if (!isObject(recordInput.result) && !isObject(recordInput.caseRef)) {
      return createFailure(
        'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID',
        ['provide_result_or_case_ref'],
      );
    }

    try {
      const storedResult = sanitizeValue(await idempotencyStore.recordDraftToCaseResult(recordInput));

      if (!ensureStoreResult(storedResult)) {
        return createFailure(
          'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORD_FAILED',
          ['retry_or_manual_review'],
        );
      }

      if (!scopedResultMatchesContext(storedResult, recordInput)) {
        return createFailure(
          'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_SCOPE_MISMATCH',
          ['verify_idempotency_scope'],
        );
      }

      return recordEnvelope(recordInput, storedResult);
    } catch (error) {
      return createFailure('REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORD_FAILED');
    }
  }

  return {
    findExistingDraftToCaseResult,
    recordDraftToCaseResult,
  };
}

module.exports = {
  RepairIntakeIdempotencyPortAdapterError,
  createRepairIntakeIdempotencyPortAdapter,
};
