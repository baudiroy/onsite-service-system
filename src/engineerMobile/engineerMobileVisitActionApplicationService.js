'use strict';

const {
  planEngineerMobileVisitActionCommand,
} = require('./engineerMobileVisitActionCommandPlanner');
const {
  ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND,
  normalizeEngineerMobileVisitActionWriterResult,
} = require('./engineerMobileVisitActionWriterResultNormalizer');

const ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND = 'engineer_mobile.visit_action_application_service';
const ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND = 'engineer_mobile.visit_action_transition_intent';
const ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND = 'engineer_mobile.visit_action_command_planner';

const MOBILE_VISIT_STATUS_BY_ACTION = Object.freeze({
  'engineer_mobile.start_travel': 'traveling',
  'engineer_mobile.arrive': 'arrived',
  'engineer_mobile.start_work': 'working',
  'engineer_mobile.finish_work': 'work_finished',
  'engineer_mobile.record_visit_result': 'visit_result_recorded',
});

const SUPPORTED_VISIT_RESULTS = Object.freeze([
  'resolved',
  'follow_up_required',
  'parts_required',
  'cannot_repair',
  'customer_unavailable',
  'cancelled_on_site',
]);

const SAFE_PLAN_REASON_CODES = Object.freeze([
  'allowed',
  'cross_scope',
  'denied',
  'ineligible',
  'invalid_assignment',
  'invalid_context',
  'invalid_state',
  'invalid_subject',
  'invalid_visit_result',
  'malformed_decision',
  'malformed_planner_result',
  'malformed_transition_intent',
  'not_assigned',
  'report_boundary',
  'unauthorized',
  'unsupported_action',
]);

const SAFE_WRITER_KINDS = Object.freeze([
  'transition',
  'audit',
]);

const SAFE_WRITER_RESULT_REASON_CODES = Object.freeze([
  'unknown_writer_kind',
  'writer_failed',
  'writer_result_unrecognized',
  'writer_succeeded',
]);

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

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function safeAction(value) {
  const action = stringValue(value);

  return Object.prototype.hasOwnProperty.call(MOBILE_VISIT_STATUS_BY_ACTION, action)
    ? action
    : undefined;
}

function safePlanReasonCode(value, fallback = 'denied') {
  const reasonCode = stringValue(value);

  return SAFE_PLAN_REASON_CODES.includes(reasonCode) ? reasonCode : fallback;
}

function safeWriterKind(value) {
  const writerKind = stringValue(value);

  return SAFE_WRITER_KINDS.includes(writerKind) ? writerKind : 'unknown';
}

function safeWriterResultReasonCode(value) {
  const reasonCode = stringValue(value);

  return SAFE_WRITER_RESULT_REASON_CODES.includes(reasonCode)
    ? reasonCode
    : 'writer_failed';
}

function absorbWriterResultRejection(result) {
  if (!isObject(result) || typeof result.catch !== 'function') {
    return;
  }

  try {
    result.catch(() => undefined);
  } catch (error) {
    // A hostile thenable must not affect the application-service envelope.
  }
}

function clonePlain(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function normalizePlannerAuditIntent(plan, allowed, reasonCode) {
  const auditIntent = isObject(plan.auditIntent) ? plan.auditIntent : {};
  const action = safeAction(plan.action);
  const safeReasonCode = safePlanReasonCode(reasonCode || plan.reasonCode);

  return compactRecord({
    type: 'engineer_mobile.visit_action_command_planner_decision',
    plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
    action,
    allowed: Boolean(allowed),
    reasonCode: safeReasonCode,
    actorId: stringValue(plan.actorId),
    appointmentId: stringValue(plan.appointmentId),
    caseId: stringValue(plan.caseId),
    organizationId: stringValue(plan.organizationId),
    requestId: stringValue(plan.requestId),
    occurredAt: stringValue(auditIntent.occurredAt),
  });
}

function normalizePlannerTransitionIntent(plan) {
  const transitionIntent = isObject(plan.transitionIntent) ? plan.transitionIntent : undefined;
  const action = safeAction(plan.action);

  if (!transitionIntent || !action) {
    return undefined;
  }

  const mobileVisitStatus = MOBILE_VISIT_STATUS_BY_ACTION[action];
  const transitionAction = safeAction(transitionIntent.action);
  const transitionMobileVisitStatus = stringValue(transitionIntent.mobileVisitStatus);

  if (
    stringValue(transitionIntent.kind) !== ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND
    || transitionAction !== action
    || transitionMobileVisitStatus !== mobileVisitStatus
    || stringValue(transitionIntent.actorId) !== stringValue(plan.actorId)
    || stringValue(transitionIntent.appointmentId) !== stringValue(plan.appointmentId)
    || stringValue(transitionIntent.organizationId) !== stringValue(plan.organizationId)
  ) {
    return undefined;
  }

  const transitionCaseId = stringValue(transitionIntent.caseId);
  const planCaseId = stringValue(plan.caseId);

  if (transitionCaseId && planCaseId && transitionCaseId !== planCaseId) {
    return undefined;
  }

  const visitResult = stringValue(transitionIntent.visitResult);

  if (
    action === 'engineer_mobile.record_visit_result'
    && !SUPPORTED_VISIT_RESULTS.includes(visitResult)
  ) {
    return undefined;
  }

  if (
    action !== 'engineer_mobile.record_visit_result'
    && visitResult
    && !SUPPORTED_VISIT_RESULTS.includes(visitResult)
  ) {
    return undefined;
  }

  return compactRecord({
    kind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND,
    action,
    actorId: stringValue(plan.actorId),
    appointmentId: stringValue(plan.appointmentId),
    caseId: planCaseId || transitionCaseId,
    organizationId: stringValue(plan.organizationId),
    mobileVisitStatus,
    visitResult: action === 'engineer_mobile.record_visit_result' ? visitResult : undefined,
    requestId: stringValue(plan.requestId),
    plannedAt: stringValue(transitionIntent.plannedAt),
  });
}

function deniedPlannerResult(plan, reasonCode) {
  const safeReasonCode = safePlanReasonCode(reasonCode || plan.reasonCode);

  return compactRecord({
    ok: false,
    allowed: false,
    action: safeAction(plan.action),
    reasonCode: safeReasonCode,
    actorId: stringValue(plan.actorId),
    appointmentId: stringValue(plan.appointmentId),
    caseId: stringValue(plan.caseId),
    organizationId: stringValue(plan.organizationId),
    requestId: stringValue(plan.requestId),
    auditIntent: normalizePlannerAuditIntent(plan, false, safeReasonCode),
  });
}

function normalizePlannerResult(plan) {
  const source = isObject(plan) ? plan : {};

  if (source.allowed !== true) {
    return deniedPlannerResult(source);
  }

  const action = safeAction(source.action);

  if (
    !action
    || stringValue(source.actorId) === undefined
    || stringValue(source.appointmentId) === undefined
    || stringValue(source.organizationId) === undefined
  ) {
    return deniedPlannerResult(source, 'malformed_planner_result');
  }

  const transitionIntent = normalizePlannerTransitionIntent(source);

  if (!transitionIntent) {
    return deniedPlannerResult(source, 'malformed_transition_intent');
  }

  return compactRecord({
    ok: true,
    allowed: true,
    action,
    reasonCode: 'allowed',
    actorId: stringValue(source.actorId),
    appointmentId: stringValue(source.appointmentId),
    caseId: stringValue(source.caseId),
    organizationId: stringValue(source.organizationId),
    requestId: stringValue(source.requestId),
    transitionIntent,
    auditIntent: normalizePlannerAuditIntent(source, true, 'allowed'),
  });
}

function safeEnvelopeFrom(plan, overrides = {}) {
  return compactRecord({
    ok: Boolean(plan.ok),
    allowed: Boolean(plan.allowed),
    serviceKind: ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND,
    action: safeAction(plan.action),
    reasonCode: safePlanReasonCode(plan.reasonCode),
    actorId: stringValue(plan.actorId),
    appointmentId: stringValue(plan.appointmentId),
    caseId: stringValue(plan.caseId),
    organizationId: stringValue(plan.organizationId),
    requestId: stringValue(plan.requestId),
    transitionIntent: clonePlain(plan.transitionIntent),
    auditIntent: clonePlain(plan.auditIntent),
    ...overrides,
  });
}

function normalizeWriterResultForService(writerKind, result) {
  absorbWriterResultRejection(result);

  const normalized = normalizeEngineerMobileVisitActionWriterResult({
    writerKind,
    result,
  });
  const source = isObject(normalized) ? normalized : {};

  return {
    ok: source.ok === true,
    writerKind: safeWriterKind(source.writerKind),
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND,
    reasonCode: safeWriterResultReasonCode(source.reasonCode),
  };
}

function writerResultSucceeded(normalizedWriterResult, writerKind) {
  return isObject(normalizedWriterResult)
    && normalizedWriterResult.ok === true
    && normalizedWriterResult.writerKind === writerKind
    && normalizedWriterResult.normalizerKind === ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND
    && normalizedWriterResult.reasonCode === 'writer_succeeded';
}

function hasTransitionWrite(transitionWriter) {
  return isObject(transitionWriter) && typeof transitionWriter.write === 'function';
}

function hasAuditRecord(auditWriter) {
  return isObject(auditWriter) && typeof auditWriter.record === 'function';
}

function transitionWriterRequired(plan) {
  return safeEnvelopeFrom(plan, {
    ok: false,
    allowed: true,
    reasonCode: 'transition_writer_required',
    transitionApplied: false,
    auditRecorded: false,
  });
}

function transitionWriteFailed(plan) {
  return safeEnvelopeFrom(plan, {
    ok: false,
    allowed: true,
    reasonCode: 'transition_write_failed',
    transitionApplied: false,
    auditRecorded: false,
  });
}

function auditWriteFailed(plan) {
  return safeEnvelopeFrom(plan, {
    ok: false,
    allowed: true,
    reasonCode: 'audit_write_failed',
    transitionApplied: true,
    auditRecorded: false,
  });
}

function appliedResult(plan, auditRecorded) {
  return safeEnvelopeFrom(plan, {
    ok: true,
    allowed: true,
    reasonCode: 'applied',
    transitionApplied: true,
    auditRecorded,
  });
}

function deniedResult(plan) {
  return safeEnvelopeFrom(plan, {
    ok: false,
    allowed: false,
    transitionApplied: false,
    auditRecorded: false,
  });
}

function createEngineerMobileVisitActionApplicationService(options = {}) {
  const source = isObject(options) ? options : {};
  const transitionWriter = source.transitionWriter;
  const auditWriter = source.auditWriter;

  function handleEngineerMobileVisitAction(command = {}) {
    const request = isObject(command) ? command : {};
    const plan = planEngineerMobileVisitActionCommand({
      action: request.action,
      actor: request.actor,
      appointment: request.appointment,
      visitResult: request.visitResult,
      now: request.now,
      requestId: request.requestId,
    });
    const normalizedPlan = normalizePlannerResult(plan);

    if (!normalizedPlan.allowed) {
      return deniedResult(normalizedPlan);
    }

    if (!hasTransitionWrite(transitionWriter)) {
      return transitionWriterRequired(normalizedPlan);
    }

    try {
      const transitionResult = transitionWriter.write(clonePlain(normalizedPlan.transitionIntent));
      const normalizedTransitionResult = normalizeWriterResultForService('transition', transitionResult);

      if (!writerResultSucceeded(normalizedTransitionResult, 'transition')) {
        return transitionWriteFailed(normalizedPlan);
      }
    } catch (error) {
      return transitionWriteFailed(normalizedPlan);
    }

    if (!hasAuditRecord(auditWriter)) {
      return appliedResult(normalizedPlan, false);
    }

    try {
      const auditResult = auditWriter.record(clonePlain(normalizedPlan.auditIntent));
      const normalizedAuditResult = normalizeWriterResultForService('audit', auditResult);

      if (!writerResultSucceeded(normalizedAuditResult, 'audit')) {
        return auditWriteFailed(normalizedPlan);
      }
    } catch (error) {
      return auditWriteFailed(normalizedPlan);
    }

    return appliedResult(normalizedPlan, true);
  }

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND,
    handleEngineerMobileVisitAction,
  };
}

module.exports = {
  createEngineerMobileVisitActionApplicationService,
  ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND,
};
