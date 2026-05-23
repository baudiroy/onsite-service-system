'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  TERMINAL_STATES,
  recordUnableToCompleteAppointmentResult,
} = require('../../src/dataCorrection/unableToCompleteAppointmentResultService');
const {
  FOLLOW_UP_PROPOSAL_TYPES,
  FOLLOW_UP_TERMINAL_STATES,
  proposeFollowUpAppointment,
} = require('../../src/dataCorrection/followUpAppointmentProposalService');
const {
  createDataCorrectionSafeWriterSet,
} = require('../../src/dataCorrection/dataCorrectionSafeWriters');

const repoRoot = path.resolve(__dirname, '../..');
const unableServiceFile = path.join(repoRoot, 'src/dataCorrection/unableToCompleteAppointmentResultService.js');
const followUpServiceFile = path.join(repoRoot, 'src/dataCorrection/followUpAppointmentProposalService.js');

function unableInput(overrides = {}) {
  return {
    organizationId: 'org_ref_normalization_001',
    actor: {
      userId: 'engineer_ref_normalization_001',
      role: 'engineer',
      permissions: [],
    },
    caseContext: {
      caseId: 'case_ref_normalization_001',
      organizationId: 'org_ref_normalization_001',
    },
    appointmentContext: {
      appointmentId: 'apt_ref_normalization_001',
      organizationId: 'org_ref_normalization_001',
      assignedEngineerId: 'engineer_ref_normalization_001',
      arrived: true,
    },
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
      note: 'site condition mismatch',
      evidenceRefs: ['photo_ref_test_001'],
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function followUpInput(overrides = {}) {
  return {
    organizationId: 'org_ref_normalization_001',
    actor: {
      userId: 'dispatcher_ref_normalization_001',
      role: 'dispatch_assistant',
      permissions: ['appointment.follow_up.propose'],
    },
    caseContext: {
      caseId: 'case_ref_normalization_001',
      organizationId: 'org_ref_normalization_001',
    },
    appointmentContext: {
      appointmentId: 'apt_ref_normalization_001',
      organizationId: 'org_ref_normalization_001',
      terminalState: FOLLOW_UP_TERMINAL_STATES.FOLLOW_UP_REQUIRED,
    },
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      note: 'schedule follow up',
      requiredPartsRefs: ['part_ref_test_001'],
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
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

function writerPayloads(store, writerType) {
  return store
    .list()
    .filter((write) => write.writerType === writerType)
    .map((write) => write.payload);
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'internal_note_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'signed_url_should_not_leak',
    'supplier_secret_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"finalAppointmentId"'), false);
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

test('unable-to-complete with safe evidenceRefs passes refs to evidenceWriter', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = recordUnableToCompleteAppointmentResult(unableInput({
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
      evidenceRefs: ['photo_ref_test_001', 'evidence_ref_test_001', 'file_ref_test_001'],
    },
  }), writerSet);

  assert.equal(result.fieldServiceReportCreated, false);
  assert.equal(result.followUpAppointmentCreated, false);
  assert.equal(writerPayloads(writerSet.store, 'evidence').length, 1);
  assert.deepEqual(writerPayloads(writerSet.store, 'evidence')[0].evidenceRefs, [
    'photo_ref_test_001',
    'evidence_ref_test_001',
    'file_ref_test_001',
  ]);
  assertSafeOutput([result, writerSet.store.list()]);
});

test('unsafe evidence refs containing URL, signed URL, token, or raw path are stripped', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  recordUnableToCompleteAppointmentResult(unableInput({
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
      evidenceRefs: [
        'photo_ref_test_001',
        'https://storage.example.test/file?signed_url_should_not_leak=1',
        '/private/tmp/raw-photo.jpg',
        'token_should_not_leak',
      ],
    },
  }), writerSet);

  assert.deepEqual(writerPayloads(writerSet.store, 'evidence')[0].evidenceRefs, [
    'photo_ref_test_001',
  ]);
  assertSafeOutput(writerSet.store.list());
});

test('evidence writer payload contains only safe evidence refs', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  recordUnableToCompleteAppointmentResult(unableInput(), writerSet);
  const evidencePayload = writerPayloads(writerSet.store, 'evidence')[0];

  assert.deepEqual(Object.keys(evidencePayload).sort(), [
    'actorRole',
    'actorUserId',
    'appointmentId',
    'caseId',
    'evidenceRefs',
    'organizationId',
    'reasonCode',
    'terminalState',
  ]);
  assert.deepEqual(evidencePayload.evidenceRefs, ['photo_ref_test_001']);
});

test('unable-to-complete still does not create FSR, follow-up appointment, or finalAppointmentId', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = recordUnableToCompleteAppointmentResult(unableInput(), writerSet);

  assert.equal(result.fieldServiceReportCreated, false);
  assert.equal(result.followUpAppointmentCreated, false);
  assert.equal(JSON.stringify(result).includes('finalAppointmentId'), false);
  assertSafeOutput([result, writerSet.store.list()]);
});

test('follow-up proposal with safe requiredPartsRefs passes refs to followUpDraftWriter', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = proposeFollowUpAppointment(followUpInput({
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      requiredPartsRefs: ['part_ref_test_001', 'part_ref_test_002'],
    },
  }), writerSet);

  assert.equal(result.formalAppointmentCreated, false);
  assert.equal(result.fieldServiceReportCreated, false);
  assert.equal(result.finalAppointmentIdChanged, false);
  assert.deepEqual(writerPayloads(writerSet.store, 'follow_up_draft')[0].requiredPartsRefs, [
    'part_ref_test_001',
    'part_ref_test_002',
  ]);
  assertSafeOutput([result, writerSet.store.list()]);
});

test('follow-up proposal supports requiredParts as equivalent input', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  proposeFollowUpAppointment(followUpInput({
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      requiredParts: ['part_ref_test_003'],
    },
  }), writerSet);

  assert.deepEqual(writerPayloads(writerSet.store, 'follow_up_draft')[0].requiredPartsRefs, [
    'part_ref_test_003',
  ]);
});

test('unsafe parts refs containing URL, token, object dump, or raw supplier data are stripped', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  proposeFollowUpAppointment(followUpInput({
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      requiredPartsRefs: [
        'part_ref_test_001',
        'https://storage.example.test/part?signed_url_should_not_leak=1',
        'supplier_secret_should_not_leak',
        {
          partId: 'part_ref_test_002',
          supplierSecret: 'supplier_secret_should_not_leak',
        },
      ],
    },
  }), writerSet);

  const followUpDraftPayloads = writerPayloads(writerSet.store, 'follow_up_draft');

  if (followUpDraftPayloads.length) {
    assert.deepEqual(followUpDraftPayloads[0].requiredPartsRefs, [
      'part_ref_test_001',
    ]);
  }
  assertSafeOutput(writerSet.store.list());
});

test('follow-up writer payload contains only safe requiredPartsRefs', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  proposeFollowUpAppointment(followUpInput(), writerSet);
  const followUpPayload = writerPayloads(writerSet.store, 'follow_up_draft')[0];

  assert.deepEqual(Object.keys(followUpPayload).sort(), [
    'actorRole',
    'actorUserId',
    'caseId',
    'organizationId',
    'proposalType',
    'reasonCode',
    'requiredPartsRefs',
    'terminalState',
  ]);
  assert.deepEqual(followUpPayload.requiredPartsRefs, ['part_ref_test_001']);
});

test('input objects are not mutated', () => {
  const unable = unableInput();
  const followUp = followUpInput();
  const beforeUnable = clone(unable);
  const beforeFollowUp = clone(followUp);

  recordUnableToCompleteAppointmentResult(unable, createDataCorrectionSafeWriterSet());
  proposeFollowUpAppointment(followUp, createDataCorrectionSafeWriterSet());

  assert.deepEqual(unable, beforeUnable);
  assert.deepEqual(followUp, beforeFollowUp);
});

test('raw phone, address, LINE id, token, secret, DB URL, and finalAppointmentId are not output', () => {
  const unableWriterSet = createDataCorrectionSafeWriterSet();
  const followUpWriterSet = createDataCorrectionSafeWriterSet();
  const unableResult = recordUnableToCompleteAppointmentResult(unableInput(), unableWriterSet);
  const followUpResult = proposeFollowUpAppointment(followUpInput(), followUpWriterSet);

  assertSafeOutput([
    unableResult,
    unableWriterSet.store.list(),
    followUpResult,
    followUpWriterSet.store.list(),
  ]);
});

test('module import boundaries remain free of DB, repository, provider, and AI imports', () => {
  const unableSpecifiers = requireSpecifiers(fs.readFileSync(unableServiceFile, 'utf8'));
  const followUpSpecifiers = requireSpecifiers(fs.readFileSync(followUpServiceFile, 'utf8'));

  assert.deepEqual(unableSpecifiers, []);
  assert.deepEqual(followUpSpecifiers, []);
  assert.equal(
    [...unableSpecifiers, ...followUpSpecifiers].some((specifier) => (
      /db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)
    )),
    false,
  );
});
