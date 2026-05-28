'use strict';

const ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_BUILDER_KIND = 'engineer_mobile.visit_action_audit_event_builder';

const ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS = Object.freeze({
  START_TRAVEL_ALLOWED: 'engineer_mobile.start_travel.allowed',
  ARRIVE_ALLOWED: 'engineer_mobile.arrive.allowed',
  START_WORK_ALLOWED: 'engineer_mobile.start_work.allowed',
  FINISH_WORK_ALLOWED: 'engineer_mobile.finish_work.allowed',
  RECORD_VISIT_RESULT_ALLOWED: 'engineer_mobile.record_visit_result.allowed',
});

const SUPPORTED_ACTIONS = Object.freeze(
  Object.values(ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS),
);

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

function denied(reasonCode) {
  return {
    ok: false,
    auditEventBuilt: false,
    auditEventBuilderKind: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_BUILDER_KIND,
    reasonCode,
  };
}

function normalizedKey(value) {
  return String(value).replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function hasFinalAppointmentBoundary(source) {
  const boundaryKey = ['final', 'appointment', 'id'].join('');

  return Object.keys(source).some((key) => normalizedKey(key) === boundaryKey);
}

function hasCompletionBoundary(source) {
  return Object.keys(source).some((key) => {
    const normalized = normalizedKey(key);
    const completionBoundaryKey = ['completion', 'report'].join('');
    const fieldReportBoundaryKey = ['field', 'service', 'report'].join('');
    const draftBoundaryKey = ['report', 'draft'].join('');

    return normalized.includes(completionBoundaryKey)
      || normalized.includes(fieldReportBoundaryKey)
      || normalized.includes(draftBoundaryKey);
  });
}

function actionFailureReason(value) {
  if (value === undefined || value === null || value === '') {
    return 'audit_action_required';
  }

  if (typeof value === 'object') {
    return 'unsupported_audit_action';
  }

  const action = stringValue(value);

  if (!action) {
    return 'audit_action_required';
  }

  return SUPPORTED_ACTIONS.includes(action) ? undefined : 'unsupported_audit_action';
}

function buildEngineerMobileVisitActionAuditEvent(options = {}) {
  const source = isObject(options) ? options : {};
  const auditIntent = source.auditIntent;

  if (!isObject(auditIntent)) {
    return denied('audit_intent_required');
  }

  if (hasCompletionBoundary(auditIntent)) {
    return denied('completion_report_boundary');
  }

  if (hasFinalAppointmentBoundary(auditIntent)) {
    return denied('final_appointment_boundary');
  }

  const actionReason = actionFailureReason(auditIntent.action);

  if (actionReason) {
    return denied(actionReason);
  }

  const action = stringValue(auditIntent.action);
  const entityType = stringValue(auditIntent.entityType);
  const entityId = stringValue(auditIntent.entityId);
  const organizationId = stringValue(auditIntent.organizationId);
  const actorId = stringValue(auditIntent.actorId);

  if (!entityType) {
    return denied('entity_type_required');
  }

  if (entityType !== 'appointment') {
    return denied('unsupported_entity_type');
  }

  if (!entityId) {
    return denied('entity_id_required');
  }

  if (!organizationId) {
    return denied('organization_id_required');
  }

  if (!actorId) {
    return denied('actor_id_required');
  }

  const caseId = stringValue(auditIntent.caseId);
  const appointmentId = stringValue(auditIntent.appointmentId);
  const requestId = stringValue(auditIntent.requestId);
  const occurredAt = stringValue(source.now) || null;
  const auditEvent = compactRecord({
    action,
    entityType,
    entityId,
    actorId,
    organizationId,
    occurredAt,
    caseId,
    appointmentId,
    requestId,
  });

  return compactRecord({
    ok: true,
    auditEventBuilt: true,
    auditEventBuilderKind: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_BUILDER_KIND,
    reasonCode: 'audit_event_built',
    action,
    entityType,
    entityId,
    actorId,
    organizationId,
    caseId,
    appointmentId,
    requestId,
    auditEvent,
  });
}

module.exports = {
  buildEngineerMobileVisitActionAuditEvent,
  ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_BUILDER_KIND,
  ENGINEER_MOBILE_VISIT_ACTION_AUDIT_EVENT_ACTIONS,
};
