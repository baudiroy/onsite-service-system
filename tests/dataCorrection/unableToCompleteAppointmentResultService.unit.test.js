'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  REASON_TO_TERMINAL_STATE,
  RESULT_STATUSES,
  TERMINAL_STATES,
  recordUnableToCompleteAppointmentResult,
  recordUnableToCompleteAppointmentResultAsync,
} = require('../../src/dataCorrection/unableToCompleteAppointmentResultService');

const repoRoot = path.resolve(__dirname, '../..');
const serviceFile = path.join(repoRoot, 'src/dataCorrection/unableToCompleteAppointmentResultService.js');

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_unable_result_001',
    actor: {
      userId: 'engineer_unable_result_001',
      role: 'engineer',
      permissions: [],
    },
    caseContext: {
      caseId: 'case_unable_result_001',
      organizationId: 'org_unable_result_001',
    },
    appointmentContext: {
      appointmentId: 'apt_unable_result_001',
      organizationId: 'org_unable_result_001',
      assignedEngineerId: 'engineer_unable_result_001',
      arrived: true,
    },
    result: {
      reasonCode: 'pending_parts',
      terminalState: TERMINAL_STATES.PENDING_PARTS,
      note: 'needs parts follow up',
      evidenceRefs: [
        {
          evidenceId: 'evidence_unable_result_001',
          attachmentId: 'attachment_unable_result_001',
          type: 'photo',
          fileType: 'image/jpeg',
          capturedAt: '2026-05-21T13:10:00.000Z',
          storagePath: 'raw_path_should_not_leak',
          rawPhone: 'raw_phone_should_not_leak',
          rawAddress: 'raw_address_should_not_leak',
          token: 'token_should_not_leak',
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
  const result = recordUnableToCompleteAppointmentResult();

  assert.equal(result.status, RESULT_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'MISSING_CONTEXT');
  assert.equal(result.fieldServiceReportCreated, false);
  assert.equal(result.followUpAppointmentCreated, false);
});

test('organization mismatch safe denies', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput({
    caseContext: {
      caseId: 'case_unable_result_001',
      organizationId: 'org_other_001',
    },
  }));

  assert.equal(result.status, RESULT_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'ORGANIZATION_SCOPE_MISMATCH');
});

test('unassigned engineer is denied', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput({
    appointmentContext: {
      appointmentId: 'apt_unable_result_001',
      organizationId: 'org_unable_result_001',
      assignedEngineerId: 'engineer_other_001',
      arrived: true,
    },
  }));

  assert.equal(result.status, RESULT_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'ACTOR_NOT_ALLOWED');
});

test('assigned engineer can record arrived unable-to-complete result', () => {
  const appointmentResultCalls = [];
  const result = recordUnableToCompleteAppointmentResult(baseInput(), {
    appointmentResultWriter: createWriter(appointmentResultCalls),
  });

  assert.equal(result.status, RESULT_STATUSES.RECORDED);
  assert.equal(result.allowed, true);
  assert.equal(result.appointmentResultRecorded, true);
  assert.equal(result.fieldServiceReportCreated, false);
  assert.equal(result.followUpAppointmentCreated, false);
  assert.equal(result.followUpRecommended, true);
  assert.equal(appointmentResultCalls.length, 1);
  assertSafeOutput([result, appointmentResultCalls]);
});

test('supervisor with permission can record result', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput({
    actor: {
      userId: 'supervisor_unable_result_001',
      role: 'supervisor',
      permissions: ['appointment.result.record'],
    },
  }), {
    appointmentResultWriter() {},
  });

  assert.equal(result.status, RESULT_STATUSES.RECORDED);
  assert.equal(result.allowed, true);
});

test('admin with permission can record result', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput({
    actor: {
      userId: 'admin_unable_result_001',
      role: 'admin',
      permissions: ['appointment.result.override'],
    },
  }), {
    appointmentResultWriter() {},
  });

  assert.equal(result.status, RESULT_STATUSES.RECORDED);
  assert.equal(result.allowed, true);
});

test('appointment not arrived is denied', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput({
    appointmentContext: {
      appointmentId: 'apt_unable_result_001',
      organizationId: 'org_unable_result_001',
      assignedEngineerId: 'engineer_unable_result_001',
      arrived: false,
    },
  }));

  assert.equal(result.status, RESULT_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'APPOINTMENT_NOT_ARRIVED');
});

test('each terminal state is accepted through reason mapping', () => {
  const examples = [
    ['pending_parts', TERMINAL_STATES.PENDING_PARTS],
    ['quote_required', TERMINAL_STATES.QUOTE_REQUIRED],
    ['customer_not_home', TERMINAL_STATES.CUSTOMER_NOT_HOME],
    ['unable_to_complete', TERMINAL_STATES.UNABLE_TO_COMPLETE],
    ['follow_up_required', TERMINAL_STATES.FOLLOW_UP_REQUIRED],
  ];

  for (const [reasonCode, terminalState] of examples) {
    const result = recordUnableToCompleteAppointmentResult(baseInput({
      result: {
        reasonCode,
        terminalState,
      },
    }), {
      appointmentResultWriter() {},
    });

    assert.equal(result.status, RESULT_STATUSES.RECORDED);
    assert.equal(result.reasonCode, reasonCode);
    assert.equal(result.terminalState, terminalState);
  }
});

test('reasonCode maps to expected terminal state when terminalState is omitted', () => {
  for (const [reasonCode, expectedTerminalState] of Object.entries(REASON_TO_TERMINAL_STATE)) {
    const result = recordUnableToCompleteAppointmentResult(baseInput({
      result: {
        reasonCode,
      },
    }));

    assert.equal(result.terminalState, expectedTerminalState);
    assert.equal(result.appointmentResultReady, true);
  }
});

test('invalid reasonCode is denied', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput({
    result: {
      reasonCode: 'invented_reason',
      terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
    },
  }));

  assert.equal(result.status, RESULT_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'INVALID_REASON_CODE');
});

test('invalid terminalState mismatch is denied', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput({
    result: {
      reasonCode: 'pending_parts',
      terminalState: TERMINAL_STATES.CUSTOMER_NOT_HOME,
    },
  }));

  assert.equal(result.status, RESULT_STATUSES.DENIED);
  assert.equal(result.reasonCode, 'TERMINAL_STATE_REASON_MISMATCH');
});

test('writer receives safe payload only', () => {
  const appointmentResultCalls = [];
  recordUnableToCompleteAppointmentResult(baseInput(), {
    appointmentResultWriter: createWriter(appointmentResultCalls),
  });

  assert.deepEqual(Object.keys(appointmentResultCalls[0]).sort(), [
    'actor',
    'appointmentId',
    'caseId',
    'evidenceRefs',
    'organizationId',
    'reasonCode',
    'safeNote',
    'terminalState',
  ]);
  assert.equal(appointmentResultCalls[0].safeNote, 'needs parts follow up');
  assertSafeOutput(appointmentResultCalls);
});

test('evidenceWriter receives safe evidence refs only', () => {
  const evidenceCalls = [];
  recordUnableToCompleteAppointmentResult(baseInput(), {
    evidenceWriter: createWriter(evidenceCalls),
  });

  assert.equal(evidenceCalls.length, 1);
  assert.deepEqual(evidenceCalls[0].evidenceRefs[0], {
    attachmentId: 'attachment_unable_result_001',
    capturedAt: '2026-05-21T13:10:00.000Z',
    evidenceId: 'evidence_unable_result_001',
    fileType: 'image/jpeg',
    type: 'photo',
  });
  assertSafeOutput(evidenceCalls);
});

test('auditWriter receives safe metadata only', () => {
  const auditCalls = [];
  recordUnableToCompleteAppointmentResult(baseInput(), {
    auditWriter: createWriter(auditCalls),
  });

  assert.equal(auditCalls.length, 1);
  assertSafeOutput(auditCalls);
});

test('writer throw safe failure no raw error leak', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput(), {
    appointmentResultWriter() {
      throw new Error('writer_failure_should_not_leak');
    },
  });

  assert.equal(result.status, RESULT_STATUSES.FAILED);
  assert.equal(result.writerResults.appointmentResult.status, 'failed');
  assertSafeOutput(result);
});

test('async unable-to-complete result awaits appointment result evidence and audit writers', async () => {
  const appointmentResultCalls = [];
  const evidenceCalls = [];
  const auditCalls = [];
  const result = await recordUnableToCompleteAppointmentResultAsync(baseInput(), {
    async appointmentResultWriter(payload) {
      appointmentResultCalls.push(payload);
      return { recorded: true };
    },
    evidenceWriter: {
      async write(payload) {
        evidenceCalls.push(payload);
        return { persisted: true };
      },
    },
    async auditWriter(payload) {
      auditCalls.push(payload);
      return { ok: true };
    },
  });

  assert.equal(result.status, RESULT_STATUSES.RECORDED);
  assert.equal(result.appointmentResultRecorded, true);
  assert.equal(result.writerResults.appointmentResult.status, 'recorded');
  assert.equal(result.writerResults.evidence.status, 'recorded');
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(appointmentResultCalls.length, 1);
  assert.equal(evidenceCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([result, appointmentResultCalls, evidenceCalls, auditCalls]);
});

test('async unable-to-complete result honors writer failure safely', async () => {
  const result = await recordUnableToCompleteAppointmentResultAsync(baseInput(), {
    async appointmentResultWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  assert.equal(result.status, RESULT_STATUSES.FAILED);
  assert.equal(result.writerResults.appointmentResult.status, 'failed');
  assert.equal(result.safeMessageKey, 'appointmentResult.writerFailed');
  assertSafeOutput(result);
});

test('raw sensitive values are stripped from output and writer payloads', () => {
  const appointmentResultCalls = [];
  const result = recordUnableToCompleteAppointmentResult(baseInput({
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
      note: 'raw_phone_should_not_leak token_should_not_leak',
      evidenceRefs: [
        {
          evidenceId: 'evidence_unable_result_001',
          storagePath: 'raw_path_should_not_leak',
          rawLineUserId: 'line_user_should_not_leak',
        },
      ],
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
  }), {
    appointmentResultWriter: createWriter(appointmentResultCalls),
  });

  assert.equal(result.status, RESULT_STATUSES.RECORDED);
  assert.equal(Object.prototype.hasOwnProperty.call(appointmentResultCalls[0], 'safeNote'), false);
  assert.deepEqual(appointmentResultCalls[0].evidenceRefs, [
    {
      evidenceId: 'evidence_unable_result_001',
    },
  ]);
  assertSafeOutput([result, appointmentResultCalls]);
});

test('finalAppointmentId is excluded and not modified', () => {
  const appointmentResultCalls = [];
  const result = recordUnableToCompleteAppointmentResult(baseInput(), {
    appointmentResultWriter: createWriter(appointmentResultCalls),
  });

  assert.equal(JSON.stringify(result).includes('finalAppointmentId'), false);
  assert.equal(JSON.stringify(appointmentResultCalls).includes('finalAppointmentId'), false);
});

test('input object is not mutated', () => {
  const input = baseInput();
  const before = clone(input);

  recordUnableToCompleteAppointmentResult(input, {
    appointmentResultWriter() {},
  });

  assert.deepEqual(input, before);
});

test('service does not create Field Service Report or follow-up appointment', () => {
  const result = recordUnableToCompleteAppointmentResult(baseInput(), {
    appointmentResultWriter() {},
  });

  assert.equal(result.fieldServiceReportCreated, false);
  assert.equal(result.followUpAppointmentCreated, false);
  assert.equal(result.followUpRecommended, true);
});

test('module import boundary has no DB, repository, provider, notification, AI, or RAG imports', () => {
  const source = fs.readFileSync(serviceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.equal(specifiers.some((specifier) => /db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});
