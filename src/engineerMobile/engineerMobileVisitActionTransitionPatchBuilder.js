'use strict';

const ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_PATCH_BUILDER_KIND = 'engineer_mobile.visit_action_transition_patch_builder';

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
    patchBuilt: false,
    patchBuilderKind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_PATCH_BUILDER_KIND,
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

function buildEngineerMobileVisitActionTransitionPatch(options = {}) {
  const source = isObject(options) ? options : {};
  const transitionIntent = source.transitionIntent;

  if (!isObject(transitionIntent)) {
    return denied('transition_intent_required');
  }

  if (hasCompletionBoundary(transitionIntent)) {
    return denied('completion_report_boundary');
  }

  if (hasFinalAppointmentBoundary(transitionIntent)) {
    return denied('final_appointment_boundary');
  }

  const appointmentId = stringValue(transitionIntent.appointmentId);
  const organizationId = stringValue(transitionIntent.organizationId);
  const actorId = stringValue(transitionIntent.actorId);
  const action = stringValue(transitionIntent.action);
  const mobileVisitStatus = stringValue(transitionIntent.mobileVisitStatus);
  const visitResult = stringValue(transitionIntent.visitResult);

  if (!appointmentId) {
    return denied('appointment_id_required');
  }

  if (!organizationId) {
    return denied('organization_id_required');
  }

  if (!actorId) {
    return denied('actor_id_required');
  }

  if (!action) {
    return denied('action_required');
  }

  if (!mobileVisitStatus) {
    return denied('mobile_visit_status_required');
  }

  if (!SUPPORTED_MOBILE_VISIT_STATUSES.includes(mobileVisitStatus)) {
    return denied('unsupported_mobile_visit_status');
  }

  if (
    mobileVisitStatus === 'visit_result_recorded'
    && !SUPPORTED_VISIT_RESULTS.includes(visitResult)
  ) {
    return denied('invalid_visit_result');
  }

  if (
    mobileVisitStatus !== 'visit_result_recorded'
    && visitResult
    && !SUPPORTED_VISIT_RESULTS.includes(visitResult)
  ) {
    return denied('invalid_visit_result');
  }

  const caseId = stringValue(transitionIntent.caseId);
  const requestId = stringValue(transitionIntent.requestId);
  const updatedAt = stringValue(source.now) || stringValue(transitionIntent.plannedAt) || null;
  const patch = compactRecord({
    appointmentId,
    caseId,
    organizationId,
    mobileVisitStatus,
    visitResult: mobileVisitStatus === 'visit_result_recorded' ? visitResult : undefined,
    updatedAt,
    updatedBy: actorId,
  });

  return compactRecord({
    ok: true,
    patchBuilt: true,
    patchBuilderKind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_PATCH_BUILDER_KIND,
    reasonCode: 'patch_built',
    action,
    actorId,
    appointmentId,
    caseId,
    organizationId,
    requestId,
    patch,
  });
}

module.exports = {
  buildEngineerMobileVisitActionTransitionPatch,
  ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_PATCH_BUILDER_KIND,
};
