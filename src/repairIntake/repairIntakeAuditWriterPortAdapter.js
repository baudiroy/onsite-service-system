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
  'rawaudit',
  'rawbody',
  'rawdraft',
  'rawinput',
  'rawplan',
  'rawportoutput',
  'rawrow',
  'rawrows',
  'repository',
  'secret',
  'sql',
  'stack',
  'token',
]);

class RepairIntakeAuditWriterPortAdapterError extends Error {
  constructor(reasonCode, requiredActions = ['configure_audit_port']) {
    super(reasonCode);
    this.name = 'RepairIntakeAuditWriterPortAdapterError';
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
    eventType: null,
    outcome: null,
    draftId: null,
    organizationId: null,
    caseId: null,
    reasonCode,
    requiredActions,
    metadata: null,
  };
}

function draftSummary(draft) {
  return sanitizeValue(compactObject({
    id: firstSafeString(draft.id, draft.draftId),
    draftId: firstSafeString(draft.draftId, draft.id),
    organizationId: safeString(draft.organizationId),
    tenantId: safeString(draft.tenantId),
    status: safeString(draft.status),
    reasonCode: safeString(draft.reasonCode),
    requiredActions: safeArray(draft.requiredActions),
    summary: draft.summary,
  }));
}

function planSummary(plan) {
  return sanitizeValue(compactObject({
    status: safeString(plan.status),
    reasonCode: safeString(plan.reasonCode),
    requiredActions: safeArray(plan.requiredActions),
    candidate: plan.candidate,
    warnings: safeArray(plan.warnings),
  }));
}

function caseRefSummary(caseRef) {
  return sanitizeValue(compactObject({
    id: firstSafeString(caseRef.id, caseRef.caseId),
    caseId: firstSafeString(caseRef.caseId, caseRef.id),
    organizationId: safeString(caseRef.organizationId),
    tenantId: safeString(caseRef.tenantId),
    sourceDraftId: safeString(caseRef.sourceDraftId),
    status: safeString(caseRef.status),
    reasonCode: safeString(caseRef.reasonCode),
    requiredActions: safeArray(caseRef.requiredActions),
    summary: caseRef.summary,
  }));
}

function createAuditInput(input) {
  const draft = draftSummary(input.draft);
  const plan = planSummary(input.plan);
  const caseRef = caseRefSummary(input.caseRef);
  const repairIntakeDraftId = firstSafeString(
    input.repairIntakeDraftId,
    input.draftId,
    draft.draftId,
    draft.id,
    caseRef.sourceDraftId,
  );

  return sanitizeValue(compactObject({
    draft,
    plan,
    caseRef,
    decision: safeString(input.decision) || 'submitted',
    draftId: repairIntakeDraftId,
    repairIntakeDraftId,
    organizationId: firstSafeString(
      input.organizationId,
      input.context && input.context.organizationId,
      draft.organizationId,
      caseRef.organizationId,
    ),
    tenantId: firstSafeString(input.tenantId, input.context && input.context.tenantId, draft.tenantId, caseRef.tenantId),
    requestId: firstSafeString(input.requestId, input.context && input.context.requestId),
    actorId: firstSafeString(
      input.actorId,
      input.context && input.context.actorId,
      input.actor && input.actor.actorId,
      input.actor && input.actor.id,
    ),
    actorRole: firstSafeString(
      input.actorRole,
      input.context && input.context.actorRole,
      input.actor && input.actor.actorRole,
      input.actor && input.actor.role,
    ),
    source: firstSafeString(input.source, input.context && input.context.source, draft.source),
    actor: input.actor || (input.context && { actorId: input.context.actorId }),
    metadata: input.metadata,
    warnings: input.warnings || plan.warnings,
  }));
}

function auditEnvelope(auditInput, auditResult = {}) {
  return sanitizeValue({
    ok: auditResult.ok !== false,
    eventType: safeString(auditResult.eventType) || 'repair_intake_draft_to_case_decision',
    outcome: safeString(auditResult.outcome) || auditInput.decision || 'submitted',
    draftId: firstSafeString(auditResult.draftId, auditInput.draftId),
    organizationId: firstSafeString(auditResult.organizationId, auditInput.organizationId),
    tenantId: firstSafeString(auditResult.tenantId, auditInput.tenantId),
    caseId: firstSafeString(auditResult.caseId, auditInput.caseRef && auditInput.caseRef.id),
    reasonCode: safeString(auditResult.reasonCode) || 'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORDED',
    requiredActions: safeArray(auditResult.requiredActions),
    metadata: auditResult.metadata || null,
  });
}

function createRepairIntakeAuditWriterPortAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const { auditPort } = safeOptions;

  if (!isObject(auditPort) || typeof auditPort.recordDraftToCaseDecision !== 'function') {
    throw new RepairIntakeAuditWriterPortAdapterError(
      'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_AUDIT_PORT_REQUIRED',
      ['configure_audit_port_record_draft_to_case_decision'],
    );
  }

  async function recordDraftToCaseDecision(input) {
    if (!isObject(input) || !isObject(input.draft) || !isObject(input.plan) || !isObject(input.caseRef)) {
      return failureEnvelope(
        'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_INPUT_INVALID',
        ['provide_valid_audit_input'],
      );
    }

    const auditInput = createAuditInput(sanitizeValue(input));

    if (!isObject(auditInput.draft) || !isObject(auditInput.plan) || !isObject(auditInput.caseRef)) {
      return failureEnvelope(
        'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_INPUT_INVALID',
        ['provide_valid_draft_plan_case_ref_summary'],
      );
    }

    try {
      const auditResult = sanitizeValue(await auditPort.recordDraftToCaseDecision(auditInput));

      if (!isObject(auditResult)) {
        return failureEnvelope('REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED');
      }

      return auditEnvelope(auditInput, auditResult);
    } catch (error) {
      return failureEnvelope('REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED');
    }
  }

  return {
    recordDraftToCaseDecision,
  };
}

module.exports = {
  RepairIntakeAuditWriterPortAdapterError,
  createRepairIntakeAuditWriterPortAdapter,
};
