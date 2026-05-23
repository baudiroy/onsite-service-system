'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  FOLLOW_UP_PROPOSAL_TYPES,
  FOLLOW_UP_TERMINAL_STATES,
  PROPOSAL_STATUSES,
  proposeFollowUpAppointment,
  proposeFollowUpAppointmentAsync,
} = require('../../src/dataCorrection/followUpAppointmentProposalService');

const repoRoot = path.resolve(__dirname, '../..');
const serviceFile = path.join(repoRoot, 'src/dataCorrection/followUpAppointmentProposalService.js');

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_follow_up_proposal_001',
    actor: {
      userId: 'dispatcher_follow_up_proposal_001',
      role: 'dispatch_assistant',
      permissions: ['dispatch.follow_up.propose'],
    },
    caseContext: {
      caseId: 'case_follow_up_proposal_001',
      organizationId: 'org_follow_up_proposal_001',
    },
    appointmentContext: {
      appointmentId: 'apt_follow_up_proposal_001',
      organizationId: 'org_follow_up_proposal_001',
      terminalState: FOLLOW_UP_TERMINAL_STATES.PENDING_PARTS,
    },
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.PARTS_RETURN_VISIT,
      reasonCode: 'pending_parts',
      note: 'schedule after parts arrive',
      requiredPartsRefs: [
        {
          partId: 'part_follow_up_001',
          partCode: 'PC-001',
          partName: 'filter module',
          quantity: 1,
          source: 'engineer_result',
          rawPhone: 'raw_phone_should_not_leak',
          rawAddress: 'raw_address_should_not_leak',
          token: 'token_should_not_leak',
          storagePath: 'raw_path_should_not_leak',
        },
      ],
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

function createWriter(calls) {
  return function writer(payload) {
    calls.push(payload);
  };
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'raw_path_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'writer_failure_should_not_leak',
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

test('missing input safe denies', () => {
  const result = proposeFollowUpAppointment();

  assert.equal(result.status, PROPOSAL_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'MISSING_CONTEXT');
  assert.equal(result.formalAppointmentCreated, false);
  assert.equal(result.fieldServiceReportCreated, false);
  assert.equal(result.finalAppointmentIdChanged, false);
});

test('organization mismatch safe denies', () => {
  const result = proposeFollowUpAppointment(baseInput({
    caseContext: {
      caseId: 'case_follow_up_proposal_001',
      organizationId: 'org_other_001',
    },
  }));

  assert.equal(result.status, PROPOSAL_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'ORGANIZATION_SCOPE_MISMATCH');
});

test('missing permission safe denies', () => {
  const result = proposeFollowUpAppointment(baseInput({
    actor: {
      userId: 'dispatcher_follow_up_proposal_001',
      role: 'dispatch_assistant',
      permissions: [],
    },
  }));

  assert.equal(result.status, PROPOSAL_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'MISSING_PERMISSION');
});

test('dispatch assistant can propose follow-up for pending_parts', () => {
  const draftCalls = [];
  const result = proposeFollowUpAppointment(baseInput(), {
    followUpDraftWriter: createWriter(draftCalls),
  });

  assert.equal(result.status, PROPOSAL_STATUSES.RECORDED);
  assert.equal(result.proposalType, FOLLOW_UP_PROPOSAL_TYPES.PARTS_RETURN_VISIT);
  assert.equal(result.terminalState, FOLLOW_UP_TERMINAL_STATES.PENDING_PARTS);
  assert.equal(result.followUpDraftRecorded, true);
  assert.equal(draftCalls.length, 1);
  assertSafeOutput([result, draftCalls]);
});

test('customer service can propose follow-up for quote_required', () => {
  const result = proposeFollowUpAppointment(baseInput({
    actor: {
      userId: 'cs_follow_up_proposal_001',
      role: 'customer_service',
      permissions: ['appointment.follow_up.propose'],
    },
    appointmentContext: {
      appointmentId: 'apt_follow_up_proposal_001',
      organizationId: 'org_follow_up_proposal_001',
      terminalState: FOLLOW_UP_TERMINAL_STATES.QUOTE_REQUIRED,
    },
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.QUOTE_REVISIT,
      reasonCode: 'quote_required',
    },
  }), {
    followUpDraftWriter() {},
  });

  assert.equal(result.status, PROPOSAL_STATUSES.RECORDED);
  assert.equal(result.terminalState, FOLLOW_UP_TERMINAL_STATES.QUOTE_REQUIRED);
});

test('supervisor and admin can propose follow-up', () => {
  for (const role of ['supervisor', 'admin']) {
    const result = proposeFollowUpAppointment(baseInput({
      actor: {
        userId: `${role}_follow_up_proposal_001`,
        role,
        permissions: ['data_correction.apply'],
      },
    }), {
      followUpDraftWriter() {},
    });

    assert.equal(result.status, PROPOSAL_STATUSES.RECORDED);
  }
});

test('engineer denied by default', () => {
  const result = proposeFollowUpAppointment(baseInput({
    actor: {
      userId: 'engineer_follow_up_proposal_001',
      role: 'engineer',
      permissions: ['dispatch.follow_up.propose'],
    },
  }));

  assert.equal(result.status, PROPOSAL_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'ACTOR_NOT_ALLOWED');
});

test('unsupported terminal state denied', () => {
  const result = proposeFollowUpAppointment(baseInput({
    appointmentContext: {
      appointmentId: 'apt_follow_up_proposal_001',
      organizationId: 'org_follow_up_proposal_001',
      terminalState: 'completed',
    },
  }));

  assert.equal(result.status, PROPOSAL_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'UNSUPPORTED_TERMINAL_STATE');
});

test('each proposal type is accepted', () => {
  for (const proposalType of Object.values(FOLLOW_UP_PROPOSAL_TYPES)) {
    const result = proposeFollowUpAppointment(baseInput({
      proposal: {
        proposalType,
        reasonCode: 'pending_parts',
      },
    }), {
      followUpDraftWriter() {},
    });

    assert.equal(result.status, PROPOSAL_STATUSES.RECORDED);
    assert.equal(result.proposalType, proposalType);
  }
});

test('invalid proposalType denied', () => {
  const result = proposeFollowUpAppointment(baseInput({
    proposal: {
      proposalType: 'instant_confirmed_appointment',
      reasonCode: 'pending_parts',
    },
  }));

  assert.equal(result.status, PROPOSAL_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'INVALID_PROPOSAL_TYPE');
});

test('invalid reasonCode denied', () => {
  const result = proposeFollowUpAppointment(baseInput({
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'invented_reason',
    },
  }));

  assert.equal(result.status, PROPOSAL_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'INVALID_REASON_CODE');
});

test('followUpDraftWriter receives safe payload only', () => {
  const draftCalls = [];
  proposeFollowUpAppointment(baseInput(), {
    followUpDraftWriter: createWriter(draftCalls),
  });

  assert.deepEqual(Object.keys(draftCalls[0]).sort(), [
    'actor',
    'caseId',
    'organizationId',
    'proposalType',
    'reasonCode',
    'requiredPartsRefs',
    'safeNote',
    'sourceAppointmentId',
    'terminalState',
  ]);
  assert.equal(draftCalls[0].safeNote, 'schedule after parts arrive');
  assertSafeOutput(draftCalls);
});

test('dispatchNoteWriter receives safe metadata only', () => {
  const dispatchNoteCalls = [];
  proposeFollowUpAppointment(baseInput(), {
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
  });

  assert.equal(dispatchNoteCalls.length, 1);
  assertSafeOutput(dispatchNoteCalls);
});

test('auditWriter receives safe metadata only', () => {
  const auditCalls = [];
  proposeFollowUpAppointment(baseInput(), {
    auditWriter: createWriter(auditCalls),
  });

  assert.equal(auditCalls.length, 1);
  assertSafeOutput(auditCalls);
});

test('writer throw safe failure no raw error leak', () => {
  const result = proposeFollowUpAppointment(baseInput(), {
    followUpDraftWriter() {
      throw new Error('writer_failure_should_not_leak');
    },
  });

  assert.equal(result.status, PROPOSAL_STATUSES.FAILED);
  assert.equal(result.writerResults.followUpDraft.status, 'failed');
  assertSafeOutput(result);
});

test('async follow-up proposal awaits draft dispatch note and audit writers', async () => {
  const draftCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const result = await proposeFollowUpAppointmentAsync(baseInput(), {
    async followUpDraftWriter(payload) {
      draftCalls.push(payload);
      return { recorded: true };
    },
    dispatchNoteWriter: {
      async write(payload) {
        dispatchNoteCalls.push(payload);
        return { persisted: true };
      },
    },
    async auditWriter(payload) {
      auditCalls.push(payload);
      return { ok: true };
    },
  });

  assert.equal(result.status, PROPOSAL_STATUSES.RECORDED);
  assert.equal(result.followUpDraftRecorded, true);
  assert.equal(result.writerResults.followUpDraft.status, 'recorded');
  assert.equal(result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(draftCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([result, draftCalls, dispatchNoteCalls, auditCalls]);
});

test('async follow-up proposal honors writer failure safely', async () => {
  const result = await proposeFollowUpAppointmentAsync(baseInput(), {
    async followUpDraftWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  assert.equal(result.status, PROPOSAL_STATUSES.FAILED);
  assert.equal(result.writerResults.followUpDraft.status, 'failed');
  assert.equal(result.safeMessageKey, 'followUpProposal.writerFailed');
  assertSafeOutput(result);
});

test('requiredPartsRefs sanitized and allow-list only', () => {
  const draftCalls = [];
  proposeFollowUpAppointment(baseInput(), {
    followUpDraftWriter: createWriter(draftCalls),
  });

  assert.deepEqual(draftCalls[0].requiredPartsRefs[0], {
    partCode: 'PC-001',
    partId: 'part_follow_up_001',
    partName: 'filter module',
    quantity: 1,
    source: 'engineer_result',
  });
  assertSafeOutput(draftCalls);
});

test('payload excludes raw sensitive values and finalAppointmentId value', () => {
  const draftCalls = [];
  const result = proposeFollowUpAppointment(baseInput({
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      note: 'raw_phone_should_not_leak token_should_not_leak',
      requiredPartsRefs: [
        {
          partId: 'part_follow_up_001',
          partCode: 'raw_phone_should_not_leak',
          rawAddress: 'raw_address_should_not_leak',
        },
      ],
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    appointmentContext: {
      appointmentId: 'apt_follow_up_proposal_001',
      organizationId: 'org_follow_up_proposal_001',
      terminalState: FOLLOW_UP_TERMINAL_STATES.FOLLOW_UP_REQUIRED,
    },
  }), {
    followUpDraftWriter: createWriter(draftCalls),
  });

  assert.equal(result.status, PROPOSAL_STATUSES.RECORDED);
  assert.equal(Object.prototype.hasOwnProperty.call(draftCalls[0], 'safeNote'), false);
  assert.deepEqual(draftCalls[0].requiredPartsRefs, [
    {
      partId: 'part_follow_up_001',
    },
  ]);
  assert.equal(JSON.stringify(draftCalls).includes('"finalAppointmentId"'), false);
  assertSafeOutput([result, draftCalls]);
});

test('returns no formal appointment, FSR, or final appointment mutation flags', () => {
  const result = proposeFollowUpAppointment(baseInput(), {
    followUpDraftWriter() {},
  });

  assert.equal(result.formalAppointmentCreated, false);
  assert.equal(result.fieldServiceReportCreated, false);
  assert.equal(result.finalAppointmentIdChanged, false);
});

test('input object is not mutated', () => {
  const input = baseInput();
  const before = clone(input);

  proposeFollowUpAppointment(input, {
    followUpDraftWriter() {},
  });

  assert.deepEqual(input, before);
});

test('module import boundary has no DB, repository, provider, notification, AI, or RAG imports', () => {
  const source = fs.readFileSync(serviceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.equal(specifiers.some((specifier) => /db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});
