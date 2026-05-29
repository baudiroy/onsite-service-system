'use strict';

const EVENT_TYPE = 'repair_intake_draft_to_case_planning_decision';
const ACTION = 'repair_intake_draft_to_case_plan';
const DEFAULT_SOURCE_BOUNDARY = 'repair_intake_draft_case_planning_service';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'billing',
  'caseid',
  'case_id',
  'casecandidate',
  'case_candidate',
  'caseno',
  'case_no',
  'caseref',
  'case_ref',
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
  'final_appointment_id',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'phone',
  'providerpayload',
  'raw',
  'rawbody',
  'rawdraft',
  'rawinput',
  'rawpayload',
  'rawportoutput',
  'rawrequest',
  'rawresult',
  'rawrow',
  'rawrows',
  'secret',
  'sql',
  'stack',
  'token',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedFieldName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function fieldIsUnsafe(key) {
  const normalized = normalizedFieldName(key);

  return normalized.startsWith('raw') || UNSAFE_FIELD_NAMES.has(normalized);
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

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function firstString(...values) {
  for (const value of values) {
    const candidate = stringValue(value);

    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

function failure(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    status: 'audit_not_recorded',
    recorded: false,
    reasonCode,
    requiredActions,
    auditEvent: null,
  };
}

function decisionStatusFromPlan(planResult) {
  const status = stringValue(planResult && planResult.status);
  const reasonCode = stringValue(planResult && planResult.reasonCode);

  if (planResult && planResult.ok === true) {
    return 'planned';
  }

  if (
    status === 'needs_review'
    || status === 'review_required'
    || reasonCode === 'duplicate_unresolved'
    || reasonCode === 'duplicate_candidate_review_required'
  ) {
    return 'review_required';
  }

  if (status === 'denied' || status === 'forbidden') {
    return 'denied';
  }

  return 'blocked';
}

function duplicateDecisionStatusFromPlan(planResult) {
  const reasonCode = stringValue(planResult && planResult.reasonCode);

  if (
    reasonCode === 'duplicate_unresolved'
    || reasonCode === 'duplicate_candidate_review_required'
  ) {
    return 'review_required';
  }

  if (reasonCode === 'duplicate_confirmed') {
    return 'blocked';
  }

  if (reasonCode === 'duplicate_clear') {
    return 'clear';
  }

  return undefined;
}

function buildRepairIntakeDraftToCasePlanningAuditEvent(input = {}) {
  if (!isObject(input)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_INPUT_INVALID',
      ['provide_planning_audit_context'],
    );
  }

  const planResult = isObject(input.planResult) ? sanitizeValue(input.planResult) : {};
  const draftId = firstString(input.draftId, planResult.draftId, input.repairIntakeDraftId);
  const organizationId = firstString(input.organizationId, planResult.organizationId);
  const actorId = firstString(input.actorId);
  const requestId = firstString(input.requestId);
  const status = stringValue(planResult.status) || 'blocked';
  const reasonCode = stringValue(planResult.reasonCode) || 'REPAIR_INTAKE_DRAFT_TO_CASE_PLAN_RESULT_UNAVAILABLE';

  if (!draftId) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_DRAFT_REQUIRED',
      ['provide_repair_intake_draft_id'],
    );
  }

  if (!organizationId) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_ORGANIZATION_REQUIRED',
      ['provide_organization_scope'],
    );
  }

  const auditEvent = sanitizeValue(compactObject({
    eventType: EVENT_TYPE,
    action: ACTION,
    visibility: 'internal_only',
    draftId,
    organizationId,
    actorId,
    requestId,
    sourceBoundary: firstString(input.sourceBoundary, input.source) || DEFAULT_SOURCE_BOUNDARY,
    decisionStatus: decisionStatusFromPlan(planResult),
    planningStatus: status,
    reasonCode,
    requiredActions: safeArray(planResult.requiredActions),
    eligible: planResult.eligible === true,
    caseCreationAllowed: planResult.caseCreationAllowed === true,
    candidateReady: planResult.candidateReady === true,
    duplicateDecisionStatus: duplicateDecisionStatusFromPlan(planResult),
    occurredAt: firstString(input.occurredAt),
  }));

  return {
    ok: true,
    status: 'audit_event_built',
    recorded: false,
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_EVENT_BUILT',
    requiredActions: [],
    auditEvent,
  };
}

function normalizeAuditEvent(auditEvent) {
  if (!isObject(auditEvent)) {
    return null;
  }

  return sanitizeValue(compactObject({
    eventType: firstString(auditEvent.eventType) || EVENT_TYPE,
    action: firstString(auditEvent.action) || ACTION,
    visibility: 'internal_only',
    draftId: firstString(auditEvent.draftId),
    organizationId: firstString(auditEvent.organizationId),
    actorId: firstString(auditEvent.actorId),
    requestId: firstString(auditEvent.requestId),
    sourceBoundary: firstString(auditEvent.sourceBoundary) || DEFAULT_SOURCE_BOUNDARY,
    decisionStatus: firstString(auditEvent.decisionStatus),
    planningStatus: firstString(auditEvent.planningStatus),
    reasonCode: firstString(auditEvent.reasonCode),
    requiredActions: safeArray(auditEvent.requiredActions),
    eligible: auditEvent.eligible === true,
    caseCreationAllowed: auditEvent.caseCreationAllowed === true,
    candidateReady: auditEvent.candidateReady === true,
    duplicateDecisionStatus: firstString(auditEvent.duplicateDecisionStatus),
    occurredAt: firstString(auditEvent.occurredAt),
  }));
}

function resolveAuditWriter(auditWriter) {
  if (typeof auditWriter === 'function') {
    return auditWriter;
  }

  if (!isObject(auditWriter)) {
    return null;
  }

  for (const methodName of [
    'recordRepairIntakeDraftToCasePlanningDecision',
    'recordDraftToCasePlanningDecision',
    'recordPlanningDecision',
    'record',
  ]) {
    if (typeof auditWriter[methodName] === 'function') {
      return auditWriter[methodName].bind(auditWriter);
    }
  }

  return null;
}

function createRepairIntakeDraftToCasePlanningAuditBoundary(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const buildAuditEvent = typeof safeOptions.auditEventBuilder === 'function'
    ? safeOptions.auditEventBuilder
    : buildRepairIntakeDraftToCasePlanningAuditEvent;
  const writeAuditEvent = resolveAuditWriter(safeOptions.auditWriter);
  const now = typeof safeOptions.clock === 'function' ? safeOptions.clock : null;

  async function recordPlanningDecision(input = {}) {
    if (!writeAuditEvent) {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_WRITER_REQUIRED',
        ['configure_planning_audit_writer'],
      );
    }

    const auditInput = {
      ...(isObject(input) ? sanitizeValue(input) : {}),
      occurredAt: firstString(input && input.occurredAt) || (now ? stringValue(now()) : undefined),
    };
    const buildResult = sanitizeValue(buildAuditEvent(auditInput));

    if (!isObject(buildResult) || buildResult.ok !== true || !isObject(buildResult.auditEvent)) {
      return failure(
        stringValue(buildResult && buildResult.reasonCode)
          || 'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_EVENT_INVALID',
        safeArray(buildResult && buildResult.requiredActions).length > 0
          ? safeArray(buildResult.requiredActions)
          : ['provide_valid_planning_audit_context'],
      );
    }

    const auditEvent = normalizeAuditEvent(buildResult.auditEvent);

    if (!isObject(auditEvent) || !auditEvent.draftId || !auditEvent.organizationId) {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_EVENT_INVALID',
        ['provide_valid_planning_audit_context'],
      );
    }

    try {
      const writeResult = sanitizeValue(await writeAuditEvent({
        auditEvent,
      }));
      const safeWrite = isObject(writeResult) ? writeResult : {};

      if (safeWrite.ok === false) {
        return {
          ok: false,
          status: 'audit_write_failed',
          recorded: false,
          reasonCode: stringValue(safeWrite.reasonCode)
            || 'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_WRITE_FAILED',
          requiredActions: safeArray(safeWrite.requiredActions).length > 0
            ? safeArray(safeWrite.requiredActions)
            : ['retry_or_manual_review'],
          auditEvent,
        };
      }

      return {
        ok: true,
        status: 'audit_recorded',
        recorded: true,
        reasonCode: stringValue(safeWrite.reasonCode)
          || 'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_RECORDED',
        requiredActions: safeArray(safeWrite.requiredActions),
        auditEvent,
      };
    } catch (error) {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_WRITE_FAILED',
        ['retry_or_manual_review'],
      );
    }
  }

  return {
    recordPlanningDecision,
  };
}

module.exports = {
  ACTION,
  EVENT_TYPE,
  buildRepairIntakeDraftToCasePlanningAuditEvent,
  createRepairIntakeDraftToCasePlanningAuditBoundary,
};
