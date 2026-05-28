'use strict';

const {
  evaluateEngineerMobileVisitAction,
} = require('./engineerMobileVisitActionPolicyRegistry');

const ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND = 'engineer_mobile.visit_action_command_planner';
const ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND = 'engineer_mobile.visit_action_transition_intent';

const MOBILE_VISIT_STATUS_BY_ACTION = Object.freeze({
  'engineer_mobile.start_travel': 'traveling',
  'engineer_mobile.arrive': 'arrived',
  'engineer_mobile.start_work': 'working',
  'engineer_mobile.finish_work': 'work_finished',
  'engineer_mobile.record_visit_result': 'visit_result_recorded',
});

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

function firstStringValue(source, keys) {
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

function safeSubject(policyDecision, actor, appointment) {
  const subject = isObject(policyDecision.subject) ? policyDecision.subject : {};

  return {
    actorId: stringValue(subject.actorId) || firstStringValue(actor, ['id', 'engineerId', 'userId']),
    appointmentId: stringValue(subject.appointmentId)
      || firstStringValue(appointment, ['appointmentId', 'appointment_id', 'id']),
    caseId: firstStringValue(appointment, ['caseId', 'case_id']),
    organizationId: stringValue(subject.organizationId)
      || firstStringValue(appointment, ['organizationId', 'organization_id']),
  };
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function safeSupportedActions(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((action) => stringValue(action))
    .filter(Boolean);
}

function auditIntentFor({ action, allowed, reasonCode, subject, now }) {
  return compactRecord({
    type: 'engineer_mobile.visit_action_command_planner_decision',
    plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
    action: stringValue(action),
    allowed: Boolean(allowed),
    reasonCode: stringValue(reasonCode),
    actorId: subject.actorId,
    appointmentId: subject.appointmentId,
    caseId: subject.caseId,
    organizationId: subject.organizationId,
    occurredAt: stringValue(now),
  });
}

function deniedCommandResult({ policyDecision, actor, appointment, now }) {
  const subject = safeSubject(policyDecision, actor, appointment);
  const action = stringValue(policyDecision.action);
  const reasonCode = stringValue(policyDecision.reasonCode) || 'denied';

  return compactRecord({
    ok: false,
    allowed: false,
    plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
    action,
    reasonCode,
    actorId: subject.actorId,
    appointmentId: subject.appointmentId,
    caseId: subject.caseId,
    organizationId: subject.organizationId,
    supportedActions: safeSupportedActions(policyDecision.supportedActions),
    auditIntent: auditIntentFor({
      action,
      allowed: false,
      reasonCode,
      subject,
      now,
    }),
  });
}

function transitionIntentFor({ policyDecision, subject, now }) {
  const action = stringValue(policyDecision.action);
  const mobileVisitStatus = MOBILE_VISIT_STATUS_BY_ACTION[action];

  return compactRecord({
    kind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND,
    action,
    actorId: subject.actorId,
    appointmentId: subject.appointmentId,
    caseId: subject.caseId,
    organizationId: subject.organizationId,
    mobileVisitStatus,
    visitResult: stringValue(policyDecision.visitResult),
    plannedAt: stringValue(now),
  });
}

function allowedCommandResult({ policyDecision, actor, appointment, now }) {
  const subject = safeSubject(policyDecision, actor, appointment);
  const action = stringValue(policyDecision.action);
  const reasonCode = 'allowed';

  return compactRecord({
    ok: true,
    allowed: true,
    plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
    action,
    reasonCode,
    actorId: subject.actorId,
    appointmentId: subject.appointmentId,
    caseId: subject.caseId,
    organizationId: subject.organizationId,
    transitionIntent: transitionIntentFor({
      policyDecision,
      subject,
      now,
    }),
    auditIntent: auditIntentFor({
      action,
      allowed: true,
      reasonCode,
      subject,
      now,
    }),
  });
}

function planEngineerMobileVisitActionCommand(options = {}) {
  const source = isObject(options) ? options : {};
  const policyDecision = evaluateEngineerMobileVisitAction({
    action: source.action,
    actor: source.actor,
    appointment: source.appointment,
    visitResult: source.visitResult,
    now: source.now,
  });

  if (!policyDecision || policyDecision.allowed !== true) {
    return deniedCommandResult({
      policyDecision: isObject(policyDecision) ? policyDecision : {},
      actor: source.actor,
      appointment: source.appointment,
      now: source.now,
    });
  }

  return allowedCommandResult({
    policyDecision,
    actor: source.actor,
    appointment: source.appointment,
    now: source.now,
  });
}

module.exports = {
  planEngineerMobileVisitActionCommand,
  ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
};
