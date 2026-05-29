'use strict';

const ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND = 'engineer_mobile.visit_action_repository_contract';

const TRANSITION_PATCH_KIND = 'engineer_mobile.visit_action_transition_patch';
const AUDIT_EVENT_KIND = 'engineer_mobile.visit_action_audit_event';

const SUPPORTED_MOBILE_VISIT_STATUSES = Object.freeze([
  'traveling',
  'arrived',
  'working',
  'work_finished',
  'visit_result_recorded',
]);

const SUPPORTED_VISIT_RESULTS = Object.freeze([
  'resolved',
  'follow_up_required',
  'parts_required',
  'cannot_repair',
  'customer_unavailable',
  'cancelled_on_site',
]);

const SUPPORTED_TRANSITION_ACTIONS = Object.freeze([
  'engineer_mobile.start_travel',
  'engineer_mobile.arrive',
  'engineer_mobile.start_work',
  'engineer_mobile.finish_work',
  'engineer_mobile.record_visit_result',
]);

const SUPPORTED_AUDIT_ACTIONS = Object.freeze([
  'engineer_mobile.start_travel.allowed',
  'engineer_mobile.arrive.allowed',
  'engineer_mobile.start_work.allowed',
  'engineer_mobile.finish_work.allowed',
  'engineer_mobile.record_visit_result.allowed',
]);

const REPOSITORY_INPUT_KEYS = Object.freeze([
  'transitionPatchEnvelope',
  'auditEventEnvelope',
]);

const TRANSITION_ROOT_KEYS = Object.freeze([
  'patchKind',
  'entityType',
  'entityId',
  'organizationId',
  'action',
  'patch',
  'auditContext',
]);

const TRANSITION_PATCH_KEYS = Object.freeze([
  'mobileVisitStatus',
  'visitResult',
  'updatedBy',
  'updatedAt',
]);

const AUDIT_CONTEXT_KEYS = Object.freeze([
  'actorId',
  'caseId',
  'appointmentId',
  'requestId',
]);

const AUDIT_ROOT_KEYS = Object.freeze([
  'eventKind',
  'action',
  'entityType',
  'entityId',
  'actorId',
  'organizationId',
  'occurredAt',
  'auditEvent',
]);

const AUDIT_EVENT_KEYS = Object.freeze([
  'action',
  'entityType',
  'entityId',
  'actorId',
  'organizationId',
  'occurredAt',
  'caseId',
  'appointmentId',
  'requestId',
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

function denied(reasonCode, extra = {}) {
  return compactRecord({
    ok: false,
    valid: false,
    contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
    reasonCode,
    ...extra,
  });
}

function accepted(reasonCode, extra = {}) {
  return compactRecord({
    ok: true,
    valid: true,
    contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
    reasonCode,
    ...extra,
  });
}

function normalizedKey(value) {
  return String(value).replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function boundaryReasonForKeys(source) {
  if (!isObject(source)) {
    return undefined;
  }

  for (const key of Object.keys(source)) {
    const normalized = normalizedKey(key);

    if (normalized === 'finalappointmentid') {
      return 'final_appointment_boundary';
    }

    if (
      normalized.includes('completionreport')
      || normalized.includes('fieldservicereport')
      || normalized.includes('reportdraft')
    ) {
      return 'completion_report_boundary';
    }
  }

  return undefined;
}

function firstDisallowedKey(source, allowedKeys) {
  if (!isObject(source)) {
    return undefined;
  }

  return Object.keys(source).find((key) => !allowedKeys.includes(key));
}

function nestedBoundaryReason(source, nestedKeys) {
  const rootReason = boundaryReasonForKeys(source);

  if (rootReason) {
    return rootReason;
  }

  for (const key of nestedKeys) {
    const reason = boundaryReasonForKeys(source[key]);

    if (reason) {
      return reason;
    }
  }

  return undefined;
}

function validateAuditContext(auditContext) {
  if (auditContext === undefined) {
    return undefined;
  }

  if (!isObject(auditContext)) {
    return 'unsafe_field_detected';
  }

  const boundaryReason = boundaryReasonForKeys(auditContext);

  if (boundaryReason) {
    return boundaryReason;
  }

  return firstDisallowedKey(auditContext, AUDIT_CONTEXT_KEYS)
    ? 'unsafe_field_detected'
    : undefined;
}

function validateTransitionPatchEnvelope(envelope) {
  if (!isObject(envelope)) {
    return denied('transition_patch_required');
  }

  const boundaryReason = nestedBoundaryReason(envelope, ['patch', 'auditContext']);

  if (boundaryReason) {
    return denied(boundaryReason);
  }

  if (firstDisallowedKey(envelope, TRANSITION_ROOT_KEYS)) {
    return denied('unsafe_field_detected');
  }

  const patchKind = stringValue(envelope.patchKind);

  if (patchKind !== TRANSITION_PATCH_KIND) {
    return denied('unsupported_patch_kind');
  }

  const entityType = stringValue(envelope.entityType);

  if (!entityType) {
    return denied('entity_type_required');
  }

  if (entityType !== 'appointment') {
    return denied('unsupported_entity_type');
  }

  const entityId = stringValue(envelope.entityId);
  const organizationId = stringValue(envelope.organizationId);
  const action = stringValue(envelope.action);

  if (!entityId) {
    return denied('entity_id_required');
  }

  if (!organizationId) {
    return denied('organization_id_required');
  }

  if (!SUPPORTED_TRANSITION_ACTIONS.includes(action)) {
    return denied('unsupported_transition_action');
  }

  if (!isObject(envelope.patch)) {
    return denied('patch_required');
  }

  if (firstDisallowedKey(envelope.patch, TRANSITION_PATCH_KEYS)) {
    return denied('unsafe_field_detected');
  }

  const auditContextReason = validateAuditContext(envelope.auditContext);

  if (auditContextReason) {
    return denied(auditContextReason);
  }

  const mobileVisitStatus = stringValue(envelope.patch.mobileVisitStatus);
  const visitResult = stringValue(envelope.patch.visitResult);
  const updatedBy = stringValue(envelope.patch.updatedBy);
  const updatedAt = stringValue(envelope.patch.updatedAt);

  if (!mobileVisitStatus) {
    return denied('mobile_visit_status_required');
  }

  if (!SUPPORTED_MOBILE_VISIT_STATUSES.includes(mobileVisitStatus)) {
    return denied('unsupported_mobile_visit_status');
  }

  if (
    (mobileVisitStatus === 'visit_result_recorded' && !SUPPORTED_VISIT_RESULTS.includes(visitResult))
    || (mobileVisitStatus !== 'visit_result_recorded' && visitResult && !SUPPORTED_VISIT_RESULTS.includes(visitResult))
  ) {
    return denied('invalid_visit_result');
  }

  if (!updatedBy) {
    return denied('updated_by_required');
  }

  return accepted('transition_patch_valid', {
    transitionPatch: compactRecord({
      patchKind,
      entityType,
      entityId,
      organizationId,
      action,
      mobileVisitStatus,
      visitResult: mobileVisitStatus === 'visit_result_recorded' ? visitResult : undefined,
      updatedBy,
      updatedAt,
    }),
  });
}

function validateAuditEventEnvelope(envelope) {
  if (envelope === undefined) {
    return accepted('audit_event_not_provided');
  }

  if (!isObject(envelope)) {
    return denied('audit_event_required');
  }

  const boundaryReason = nestedBoundaryReason(envelope, ['auditEvent']);

  if (boundaryReason) {
    return denied(boundaryReason);
  }

  if (firstDisallowedKey(envelope, AUDIT_ROOT_KEYS)) {
    return denied('unsafe_field_detected');
  }

  const eventKind = stringValue(envelope.eventKind);

  if (eventKind !== AUDIT_EVENT_KIND) {
    return denied('unsupported_event_kind');
  }

  const action = stringValue(envelope.action);

  if (!SUPPORTED_AUDIT_ACTIONS.includes(action)) {
    return denied('unsupported_audit_action');
  }

  const entityType = stringValue(envelope.entityType);

  if (!entityType) {
    return denied('entity_type_required');
  }

  if (entityType !== 'appointment') {
    return denied('unsupported_entity_type');
  }

  const entityId = stringValue(envelope.entityId);
  const organizationId = stringValue(envelope.organizationId);
  const actorId = stringValue(envelope.actorId);
  const occurredAt = stringValue(envelope.occurredAt);

  if (!entityId) {
    return denied('entity_id_required');
  }

  if (!organizationId) {
    return denied('organization_id_required');
  }

  if (!actorId) {
    return denied('actor_id_required');
  }

  if (!occurredAt) {
    return denied('occurred_at_required');
  }

  if (!isObject(envelope.auditEvent)) {
    return denied('audit_event_required');
  }

  if (firstDisallowedKey(envelope.auditEvent, AUDIT_EVENT_KEYS)) {
    return denied('unsafe_field_detected');
  }
  const auditEvent = envelope.auditEvent;

  return accepted('audit_event_valid', {
    auditEvent: compactRecord({
      eventKind,
      action,
      entityType,
      entityId,
      actorId,
      organizationId,
      occurredAt,
      caseId: stringValue(auditEvent.caseId),
      appointmentId: stringValue(auditEvent.appointmentId),
      requestId: stringValue(auditEvent.requestId),
    }),
  });
}

function validateEngineerMobileVisitActionRepositoryInput(input) {
  if (!isObject(input)) {
    return denied('transition_patch_required');
  }

  if (firstDisallowedKey(input, REPOSITORY_INPUT_KEYS)) {
    return denied('unsafe_field_detected');
  }

  const transitionResult = validateTransitionPatchEnvelope(input.transitionPatchEnvelope);

  if (!transitionResult.ok) {
    return denied(transitionResult.reasonCode);
  }

  const auditResult = validateAuditEventEnvelope(input.auditEventEnvelope);

  if (!auditResult.ok) {
    return denied(auditResult.reasonCode);
  }

  if (auditResult.auditEvent) {
    if (transitionResult.transitionPatch.organizationId !== auditResult.auditEvent.organizationId) {
      return denied('organization_mismatch');
    }

    if (transitionResult.transitionPatch.entityId !== auditResult.auditEvent.entityId) {
      return denied('entity_mismatch');
    }
  }

  return accepted('repository_input_valid', {
    transitionPatch: transitionResult.transitionPatch,
    auditEvent: auditResult.auditEvent,
  });
}

function normalizeEngineerMobileVisitActionRepositoryResult(result) {
  if (result === undefined || result === null || result === true) {
    return {
      ok: true,
      contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
      reasonCode: 'repository_write_succeeded',
      transitionPersisted: true,
      auditRecorded: 'not_provided',
    };
  }

  if (!isObject(result)) {
    return {
      ok: false,
      contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
      reasonCode: 'repository_write_failed',
    };
  }

  if (result.ok === false || result.persisted === false || result.written === false) {
    return {
      ok: false,
      contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
      reasonCode: 'repository_write_failed',
    };
  }

  const success = result.ok === true
    || result.persisted === true
    || result.written === true
    || result.transitionPersisted === true;

  if (!success) {
    return {
      ok: false,
      contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
      reasonCode: 'repository_result_unrecognized',
    };
  }

  return {
    ok: true,
    contractKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
    reasonCode: 'repository_write_succeeded',
    transitionPersisted: true,
    auditRecorded: result.auditRecorded === true ? true : 'not_provided',
  };
}

module.exports = {
  ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_CONTRACT_KIND,
  validateEngineerMobileVisitActionRepositoryInput,
  validateEngineerMobileVisitActionRepositoryResult: normalizeEngineerMobileVisitActionRepositoryResult,
  normalizeEngineerMobileVisitActionRepositoryResult,
};
