'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CORRECTION_FIELD_GROUPS,
  DATA_CORRECTION_DECISIONS,
  DATA_CORRECTION_REASONS,
  evaluateDataCorrectionPolicy,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');

const repoRoot = path.resolve(__dirname, '../..');
const policyFile = path.join(repoRoot, 'src/dataCorrection/dataCorrectionPolicyEngine.js');

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_data_correction_001',
    actor: {
      userId: 'user_data_correction_001',
      role: 'customer_service',
      permissions: ['case.correction.request'],
    },
    caseContext: {
      caseId: 'case_data_correction_001',
      organizationId: 'org_data_correction_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_001',
      status: 'confirmed',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old',
      toValue: 'new',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertSafeOutput(result) {
  const serialized = JSON.stringify(result);

  for (const forbiddenValue of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'audit_log_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('missing input returns safe deny', () => {
  const result = evaluateDataCorrectionPolicy();

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.MISSING_CONTEXT);
  assertSafeOutput(result);
});

test('organization mismatch returns safe deny', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    caseContext: {
      caseId: 'case_data_correction_001',
      organizationId: 'org_other',
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.ORGANIZATION_SCOPE_MISMATCH);
});

test('missing permission returns safe deny', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    actor: {
      userId: 'user_data_correction_001',
      role: 'customer_service',
      permissions: [],
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.MISSING_PERMISSION);
});

test('customer service pre-departure non-phone correction is allowed', () => {
  const result = evaluateDataCorrectionPolicy(baseInput());

  assert.equal(result.allowed, true);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.PRE_DEPARTURE_CORRECTION_ALLOWED);
  assert.equal(result.auditRequired, true);
});

test('dispatch assistant pre-departure non-phone correction is allowed', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    actor: {
      userId: 'dispatch_user_001',
      role: 'dispatch_assistant',
      permissions: ['case.correction.request'],
    },
  }));

  assert.equal(result.allowed, true);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
});

test('supervisor and admin pre-departure non-phone corrections are allowed', () => {
  for (const role of ['supervisor', 'admin']) {
    const result = evaluateDataCorrectionPolicy(baseInput({
      actor: {
        userId: `${role}_user_001`,
        role,
        permissions: ['case.correction.apply'],
      },
    }));

    assert.equal(result.allowed, true);
    assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  }
});

test('engineer role cannot apply general correction by default', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    actor: {
      userId: 'engineer_user_001',
      role: 'engineer',
      permissions: ['case.correction.request'],
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.ACTOR_ROLE_NOT_ALLOWED);
});

test('AI actor cannot apply official correction', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    actor: {
      userId: 'ai_actor_001',
      role: 'ai',
      permissions: ['case.correction.apply'],
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.AI_ACTOR_NOT_ALLOWED);
  assert.equal(result.auditRequired, true);
});

test('phone field correction requires phone re-verification', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    correction: {
      fieldKey: 'customerPhone',
      fieldGroup: CORRECTION_FIELD_GROUPS.REPAIR_OPERATIONAL,
      fromValue: 'old',
      toValue: 'new',
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.PHONE_REVERIFICATION_REQUIRED);
  assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.PHONE_CHANGE_REQUIRES_REVERIFICATION);
  assert.equal(result.phoneReverificationRequired, true);
  assert.equal(result.auditRequired, true);
});

test('lineUserId and channel identity corrections require phone re-verification', () => {
  for (const correction of [
    { fieldKey: 'lineUserId', fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL },
    { fieldKey: 'line_channel_id', fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL },
    { fieldKey: 'customerChannelIdentity', fieldGroup: CORRECTION_FIELD_GROUPS.UNKNOWN },
    { fieldKey: 'safeField', fieldGroup: CORRECTION_FIELD_GROUPS.CUSTOMER_CHANNEL_IDENTITY },
  ]) {
    const result = evaluateDataCorrectionPolicy(baseInput({ correction }));

    assert.equal(result.allowed, false);
    assert.equal(result.decision, DATA_CORRECTION_DECISIONS.PHONE_REVERIFICATION_REQUIRED);
    assert.equal(result.phoneReverificationRequired, true);
  }
});

test('phone correction is never allowed even before departure', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    correction: {
      fieldKey: 'phoneNumber',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.PHONE_REVERIFICATION_REQUIRED);
});

test('engineer received task but not departed requires engineer reconfirm', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }));

  assert.equal(result.allowed, true);
  assert.equal(result.engineerReconfirmRequired, true);
});

test('engineer departed requires manual contact, dispatch note, and audit', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED);
  assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.CORRECTION_FROZEN_AFTER_DEPARTURE);
  assert.equal(result.contactLogRequired, true);
  assert.equal(result.dispatchNoteRequired, true);
  assert.equal(result.auditRequired, true);
});

test('route started requires manual contact, dispatch note, and audit', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: true,
      arrived: false,
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED);
  assert.equal(result.contactLogRequired, true);
  assert.equal(result.dispatchNoteRequired, true);
  assert.equal(result.auditRequired, true);
});

test('arrived requires engineer evidence flow', () => {
  const result = evaluateDataCorrectionPolicy(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: true,
      arrived: true,
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ENGINEER_EVIDENCE_REQUIRED);
  assert.equal(result.engineerEvidenceRequired, true);
  assert.equal(result.contactLogRequired, true);
  assert.equal(result.dispatchNoteRequired, true);
  assert.equal(result.auditRequired, true);
});

test('internal-only and unknown non-phone fields are safe denied', () => {
  for (const fieldGroup of [
    CORRECTION_FIELD_GROUPS.INTERNAL_ONLY,
    CORRECTION_FIELD_GROUPS.UNKNOWN,
  ]) {
    const result = evaluateDataCorrectionPolicy(baseInput({
      correction: {
        fieldKey: 'internalNote',
        fieldGroup,
      },
    }));

    assert.equal(result.allowed, false);
    assert.equal(result.reasonCode, DATA_CORRECTION_REASONS.FIELD_GROUP_NOT_ALLOWED);
  }
});

test('output does not expose raw identifiers, secrets, internal notes, AI payloads, or finalAppointmentId', () => {
  const result = evaluateDataCorrectionPolicy(baseInput());

  assertSafeOutput(result);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'finalAppointmentId'), false);
});

test('input object is not mutated', () => {
  const input = baseInput();
  const before = clone(input);

  evaluateDataCorrectionPolicy(input);

  assert.deepEqual(input, before);
});

test('module has no DB, repository, provider, notification, AI, or RAG imports', () => {
  const source = fs.readFileSync(policyFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /from ['"][^'"]*(db|pool|repository|transaction|provider|line|sms|email|push|rag|vector)[^'"]*['"]/i);
});
