'use strict';

const DATA_CORRECTION_DECISIONS = Object.freeze({
  ALLOW_PRE_DEPARTURE_CORRECTION: 'allow_pre_departure_correction',
  PHONE_REVERIFICATION_REQUIRED: 'phone_reverification_required',
  BLOCKED_AFTER_DEPARTURE: 'blocked_after_departure',
  MANUAL_DISPATCH_CONTACT_REQUIRED: 'manual_dispatch_contact_required',
  ENGINEER_EVIDENCE_REQUIRED: 'engineer_evidence_required',
  SAFE_DENY: 'safe_deny',
});

const DATA_CORRECTION_REASONS = Object.freeze({
  MISSING_CONTEXT: 'MISSING_CONTEXT',
  ORGANIZATION_SCOPE_MISMATCH: 'ORGANIZATION_SCOPE_MISMATCH',
  MISSING_ACTOR: 'MISSING_ACTOR',
  MISSING_PERMISSION: 'MISSING_PERMISSION',
  ACTOR_ROLE_NOT_ALLOWED: 'ACTOR_ROLE_NOT_ALLOWED',
  AI_ACTOR_NOT_ALLOWED: 'AI_ACTOR_NOT_ALLOWED',
  PHONE_CHANGE_REQUIRES_REVERIFICATION: 'PHONE_CHANGE_REQUIRES_REVERIFICATION',
  PRE_DEPARTURE_CORRECTION_ALLOWED: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
  CORRECTION_FROZEN_AFTER_DEPARTURE: 'CORRECTION_FROZEN_AFTER_DEPARTURE',
  ENGINEER_EVIDENCE_REQUIRED_AFTER_ARRIVAL: 'ENGINEER_EVIDENCE_REQUIRED_AFTER_ARRIVAL',
  FIELD_GROUP_NOT_ALLOWED: 'FIELD_GROUP_NOT_ALLOWED',
});

const CORRECTION_FIELD_GROUPS = Object.freeze({
  PHONE_IDENTITY: 'phone_identity',
  CUSTOMER_CHANNEL_IDENTITY: 'customer_channel_identity',
  REPAIR_OPERATIONAL: 'repair_operational',
  DISPATCH_OPERATIONAL: 'dispatch_operational',
  APPOINTMENT_OPERATIONAL: 'appointment_operational',
  INTERNAL_ONLY: 'internal_only',
  UNKNOWN: 'unknown',
});

const ALLOWED_PRE_DEPARTURE_ROLES = new Set([
  'customer_service',
  'dispatch_assistant',
  'supervisor',
  'admin',
]);

const ALLOWED_CORRECTION_PERMISSIONS = new Set([
  'case.correction.request',
  'case.correction.apply',
  'data_correction.request',
  'data_correction.apply',
]);

const OPERATIONAL_FIELD_GROUPS = new Set([
  CORRECTION_FIELD_GROUPS.REPAIR_OPERATIONAL,
  CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
  CORRECTION_FIELD_GROUPS.APPOINTMENT_OPERATIONAL,
]);

const PHONE_IDENTITY_FIELD_KEYS = new Set([
  'phone',
  'phonenumber',
  'customerphone',
  'contactphone',
  'mobile',
  'lineuserid',
  'line_user_id',
  'linechannelid',
  'line_channel_id',
  'customerchannelidentity',
  'customer_channel_identity',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKey(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function hasCorrectionPermission(actor) {
  if (!isPlainObject(actor) || !Array.isArray(actor.permissions)) {
    return false;
  }

  return actor.permissions.some((permission) => ALLOWED_CORRECTION_PERMISSIONS.has(permission));
}

function isAiActor(actor) {
  if (!isPlainObject(actor)) {
    return false;
  }

  return normalizeRole(actor.role) === 'ai'
    || normalizeRole(actor.actorType) === 'ai'
    || normalizeRole(actor.type) === 'ai';
}

function isPhoneIdentityCorrection(correction) {
  if (!isPlainObject(correction)) {
    return false;
  }

  if (
    correction.fieldGroup === CORRECTION_FIELD_GROUPS.PHONE_IDENTITY
    || correction.fieldGroup === CORRECTION_FIELD_GROUPS.CUSTOMER_CHANNEL_IDENTITY
  ) {
    return true;
  }

  return PHONE_IDENTITY_FIELD_KEYS.has(normalizeKey(correction.fieldKey));
}

function baseDecision(decision, reasonCode, overrides = {}) {
  return {
    allowed: false,
    decision,
    reasonCode,
    customerVisible: false,
    auditRequired: false,
    auditEventType: 'data_correction_blocked',
    contactLogRequired: false,
    dispatchNoteRequired: false,
    engineerReconfirmRequired: false,
    engineerEvidenceRequired: false,
    phoneReverificationRequired: false,
    safeMessageKey: 'dataCorrection.unavailable',
    ...overrides,
  };
}

function safeDeny(reasonCode) {
  return baseDecision(DATA_CORRECTION_DECISIONS.SAFE_DENY, reasonCode);
}

function organizationsMatch(input) {
  const organizationId = input.organizationId;
  const caseOrganizationId = input.caseContext && input.caseContext.organizationId;

  return Boolean(organizationId && caseOrganizationId && organizationId === caseOrganizationId);
}

function shouldRequireEngineerReconfirm(appointmentContext) {
  return Boolean(
    isPlainObject(appointmentContext)
    && (appointmentContext.appointmentId || appointmentContext.engineerReceivedTask)
    && !appointmentContext.engineerDeparted
    && !appointmentContext.routeStarted
    && !appointmentContext.arrived
  );
}

function evaluateDataCorrectionPolicy(input) {
  const request = isPlainObject(input) ? input : {};
  const actor = request.actor;
  const correction = request.correction;
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};

  if (!request.organizationId || !request.caseContext || !request.caseContext.caseId) {
    return safeDeny(DATA_CORRECTION_REASONS.MISSING_CONTEXT);
  }

  if (!organizationsMatch(request)) {
    return safeDeny(DATA_CORRECTION_REASONS.ORGANIZATION_SCOPE_MISMATCH);
  }

  if (!isPlainObject(actor) || !actor.role) {
    return safeDeny(DATA_CORRECTION_REASONS.MISSING_ACTOR);
  }

  if (isAiActor(actor)) {
    return baseDecision(
      DATA_CORRECTION_DECISIONS.SAFE_DENY,
      DATA_CORRECTION_REASONS.AI_ACTOR_NOT_ALLOWED,
      { auditRequired: true },
    );
  }

  if (!hasCorrectionPermission(actor)) {
    return safeDeny(DATA_CORRECTION_REASONS.MISSING_PERMISSION);
  }

  if (isPhoneIdentityCorrection(correction)) {
    return baseDecision(
      DATA_CORRECTION_DECISIONS.PHONE_REVERIFICATION_REQUIRED,
      DATA_CORRECTION_REASONS.PHONE_CHANGE_REQUIRES_REVERIFICATION,
      {
        auditRequired: true,
        phoneReverificationRequired: true,
      },
    );
  }

  if (appointmentContext.arrived) {
    return baseDecision(
      DATA_CORRECTION_DECISIONS.ENGINEER_EVIDENCE_REQUIRED,
      DATA_CORRECTION_REASONS.ENGINEER_EVIDENCE_REQUIRED_AFTER_ARRIVAL,
      {
        auditRequired: true,
        contactLogRequired: true,
        dispatchNoteRequired: true,
        engineerEvidenceRequired: true,
      },
    );
  }

  if (appointmentContext.engineerDeparted || appointmentContext.routeStarted) {
    return baseDecision(
      DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED,
      DATA_CORRECTION_REASONS.CORRECTION_FROZEN_AFTER_DEPARTURE,
      {
        auditRequired: true,
        contactLogRequired: true,
        dispatchNoteRequired: true,
      },
    );
  }

  if (!ALLOWED_PRE_DEPARTURE_ROLES.has(normalizeRole(actor.role))) {
    return safeDeny(DATA_CORRECTION_REASONS.ACTOR_ROLE_NOT_ALLOWED);
  }

  if (!isPlainObject(correction) || !OPERATIONAL_FIELD_GROUPS.has(correction.fieldGroup)) {
    return safeDeny(DATA_CORRECTION_REASONS.FIELD_GROUP_NOT_ALLOWED);
  }

  return baseDecision(
    DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION,
    DATA_CORRECTION_REASONS.PRE_DEPARTURE_CORRECTION_ALLOWED,
    {
      allowed: true,
      auditRequired: true,
      auditEventType: 'data_correction_allowed',
      engineerReconfirmRequired: shouldRequireEngineerReconfirm(appointmentContext),
      safeMessageKey: 'dataCorrection.allowed',
    },
  );
}

module.exports = {
  CORRECTION_FIELD_GROUPS,
  DATA_CORRECTION_DECISIONS,
  DATA_CORRECTION_REASONS,
  evaluateDataCorrectionPolicy,
};
