'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_EVENT_TYPES,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder');
const {
  CORRECTION_FIELD_GROUPS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  processDataCorrectionRequest,
  processDataCorrectionRequestAsync,
} = require('../../src/dataCorrection/dataCorrectionRequestService');
const {
  applyPreDepartureCorrection,
  applyPreDepartureCorrectionAsync,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  task887Doc: 'docs/task-887-data-correction-decision-audit-service-injected-writer-path-no-real-db-no-api-shape-change.md',
  task887UnitTest: 'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
});

const UNSAFE_VALUES = Object.freeze([
  'from value should not leak',
  'after value should not leak',
  '0912-345-678',
  'raw address should not leak',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'postgres://unsafe',
  'Error: unsafe stack',
  'SELECT * FROM unsafe',
  'apt_final_unsafe_001',
  'fsr_unsafe_001',
  'report_unsafe_001',
  'internal note should not leak',
  'audit raw payload should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'full payload should not leak',
  'provider payload should not leak',
  'customer report should not leak',
  'file bytes should not leak',
  'decision writer raw failure should not leak',
]);

const UNSAFE_KEYS = Object.freeze([
  'fromValue',
  'toValue',
  'beforeValue',
  'afterValue',
  'rawCorrectionPayload',
  'rawPhone',
  'rawAddress',
  'rawLineUserId',
  'token',
  'secret',
  'dbUrl',
  'stack',
  'rawSql',
  'finalAppointmentId',
  'fieldServiceReportId',
  'reportId',
  'internalNote',
  'auditRawPayload',
  'aiRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'fullPayload',
  'providerPayload',
  'customerVisibleReportBody',
  'photoContents',
  'signatureContents',
  'fileContents',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_decision_audit_closure_887',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_decision_audit_closure_887',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_decision_audit_closure_887',
      organizationId: 'org_decision_audit_closure_887',
    },
    appointmentContext: {
      appointmentId: 'appt_decision_audit_closure_887',
      arrived: false,
      engineerDeparted: false,
      engineerReceivedTask: false,
      routeStarted: false,
    },
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      fromValue: 'from value should not leak',
      toValue: 'safe issue summary',
      beforeValue: 'from value should not leak',
      afterValue: 'after value should not leak',
      rawCorrectionPayload: 'raw correction payload should not leak',
      rawPhone: '0912-345-678',
      rawAddress: 'raw address should not leak',
      rawLineUserId: 'LINE-RAW-USER-ID',
      internalNote: 'internal note should not leak',
      auditRawPayload: 'audit raw payload should not leak',
      aiRawPayload: 'ai raw payload should not leak',
      billingInternalData: 'billing internal should not leak',
      settlementInternalData: 'settlement internal should not leak',
      finalAppointmentId: 'apt_final_unsafe_001',
      fieldServiceReportId: 'fsr_unsafe_001',
      reportId: 'report_unsafe_001',
    },
    fullPayload: 'full payload should not leak',
    providerPayload: 'provider payload should not leak',
    customerVisibleReportBody: 'customer report should not leak',
    photoContents: 'file bytes should not leak',
    signatureContents: 'file bytes should not leak',
    fileContents: 'file bytes should not leak',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'postgres://unsafe',
    stack: 'Error: unsafe stack',
    rawSql: 'SELECT * FROM unsafe',
    ...overrides,
  };
}

function createDecisionAuditWriter(calls, result) {
  return function decisionAuditWriter(payload) {
    calls.push(payload);

    return result;
  };
}

function createCorrectionWriter(calls, result = { ok: true }) {
  return function correctionWriter(payload) {
    calls.push(payload);

    return result;
  };
}

function assertSafe(value) {
  const serialized = JSON.stringify(value);

  for (const unsafe of UNSAFE_VALUES) {
    assert.equal(serialized.includes(unsafe), false, `unsafe value leaked: ${unsafe}`);
  }

  for (const key of UNSAFE_KEYS) {
    assert.equal(serialized.includes(`"${key}"`), false, `unsafe key leaked: ${key}`);
  }

  [
    /postgres(?:ql)?:\/\/[^\s"')]+/i,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /SELECT\s+\*\s+FROM/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(serialized), false, `unsafe pattern leaked: ${pattern}`);
  });
}

function assertSafeRequestIntent(payload) {
  assert.equal(payload.action, DATA_CORRECTION_AUDIT_ACTIONS.REQUEST);
  assert.equal(payload.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED);
  assert.equal(payload.organizationId, 'org_decision_audit_closure_887');
  assert.equal(payload.caseId, 'case_decision_audit_closure_887');
  assert.equal(payload.appointmentId, 'appt_decision_audit_closure_887');
  assert.equal(payload.actorId, 'user_decision_audit_closure_887');
  assert.equal(payload.actorRole, 'dispatch_assistant');
  assert.equal(payload.fieldKey, 'issueSummary');
  assert.equal(payload.fieldGroup, CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL);
  assertSafe(payload);
}

function assertSafeApplyIntent(payload, expectedEventType = DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED) {
  assert.equal(payload.action, DATA_CORRECTION_AUDIT_ACTIONS.APPLY);
  assert.equal(payload.eventType, expectedEventType);
  assert.equal(payload.organizationId, 'org_decision_audit_closure_887');
  assert.equal(payload.caseId, 'case_decision_audit_closure_887');
  assert.equal(payload.appointmentId, 'appt_decision_audit_closure_887');
  assert.equal(payload.actorId, 'user_decision_audit_closure_887');
  assert.equal(payload.actorRole, 'dispatch_assistant');
  assert.equal(payload.fieldKey, 'issueSummary');
  assert.equal(payload.fieldGroup, CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL);
  assertSafe(payload);
}

test('Task887 evidence doc and unit test exist before closure', () => {
  [
    FILES.task887Doc,
    FILES.task887UnitTest,
    FILES.requestService,
    FILES.applyService,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('Task887 evidence records accepted no-real-DB no-public-shape-change boundary', () => {
  const doc = read(FILES.task887Doc);

  assertIncludesAll(doc, [
    'Status: completed',
    'optional `decisionAuditWriter` support',
    'no default writer configuration',
    'no service/app/API public response shape change',
    'no route/controller/DTO change',
    'no real DB connection',
    'no global DB import',
    'no `psql`',
    'no migration execution',
    'no dry-run',
    'no apply',
    'no provider / LINE / SMS / App push / webhook / email runtime',
    'no AI / RAG runtime',
    'no billing / settlement runtime',
    'no admin frontend',
    'no package change',
    'no smoke/integration test',
    'Default service output remains unchanged',
    'safe `decisionAuditWriterResult`',
  ]);
});

test('request and apply services import only allowed local service dependencies', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.requestService)), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
  ]);
  assert.deepEqual(requireSpecifiers(read(FILES.applyService)), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
    './dataCorrectionRequestService',
  ]);
});

test('request and apply services avoid real DB repository provider AI API app billing settlement and permission imports', () => {
  for (const file of [FILES.requestService, FILES.applyService]) {
    const source = read(file);

    [
      /require\(['"][^'"]*(?:db|database|pool|pg|repository|config|env|provider|line|sms|webhook|email|push|ai|rag|billing|settlement|permission|route|controller|app|server|FieldServiceReport|AppointmentService|CaseService)[^'"]*['"]\)/i,
      /createDataCorrectionDecisionAuditWriter/,
      /createDataCorrectionDecisionAuditRepository/,
      /process\.env/,
      /console\./,
      /fetch\(/,
      /axios/,
      /createServer/,
      /app\.listen/,
      /new\s+Pool/,
      /pool\.query/,
      /client\.query/,
    ].forEach((pattern) => {
      assert.equal(pattern.test(source), false, `${file} matched forbidden pattern ${pattern}`);
    });
  }
});

test('decisionAuditWriter stays opt-in and no default writer is configured', () => {
  const input = baseInput();
  const request = processDataCorrectionRequest(input, { includeDecisionAuditIntent: true });
  const apply = applyPreDepartureCorrection(input, {
    correctionWriter: createCorrectionWriter([]),
    includeDecisionAuditIntent: true,
  });

  assert.equal(request.decisionAuditWriterResult, undefined);
  assert.equal(apply.decisionAuditWriterResult, undefined);
  assert.equal(request.response.allowed, true);
  assert.equal(apply.response.correctionApplied, true);
  assertSafe([request, apply]);
});

test('public/default response shape remains unchanged even when decisionAuditWriter is injected', () => {
  const auditCalls = [];
  const request = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { ok: true }),
  });
  const apply = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter([]),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { ok: true }),
  });

  assert.equal(request.auditIntent, undefined);
  assert.equal(request.response, undefined);
  assert.equal(request.decisionAuditWriterResult, undefined);
  assert.equal(apply.auditIntent, undefined);
  assert.equal(apply.response, undefined);
  assert.equal(apply.decisionAuditWriterResult, undefined);
  assert.equal(request.allowed, true);
  assert.equal(apply.correctionApplied, true);
  assert.equal(auditCalls.length, 2);
  assertSafe([request, apply, auditCalls]);
});

test('internal side-channel exposes safe decisionAuditWriterResult only when explicitly requested', () => {
  const auditCalls = [];
  const request = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { ok: true, persisted: true }),
    includeDecisionAuditIntent: true,
  });
  const apply = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter([]),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { ok: true, persisted: true }),
    includeDecisionAuditIntent: true,
  });

  assert.deepEqual(request.decisionAuditWriterResult, { status: 'recorded' });
  assert.deepEqual(apply.decisionAuditWriterResult, { status: 'recorded' });
  assertSafeRequestIntent(auditCalls[0]);
  assertSafeApplyIntent(auditCalls[1]);
  assertSafe([request, apply, auditCalls]);
});

test('decisionAuditWriter failure is redacted and does not change official request or apply outcome', () => {
  const auditCalls = [];
  const request = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, {
      ok: false,
      persisted: false,
      stack: 'decision writer raw failure should not leak',
      rawSql: 'SELECT * FROM unsafe',
      dbUrl: 'postgres://unsafe',
    }),
    includeDecisionAuditIntent: true,
  });
  const correctionCalls = [];
  const apply = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter(correctionCalls),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, {
      auditWritten: false,
      error: 'decision writer raw failure should not leak',
      token: 'token-value',
    }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(request.response.status, 'allowed');
  assert.equal(request.response.allowed, true);
  assert.equal(apply.response.status, 'applied');
  assert.equal(apply.response.correctionApplied, true);
  assert.deepEqual(request.decisionAuditWriterResult, {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assert.deepEqual(apply.decisionAuditWriterResult, {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assert.equal(correctionCalls.length, 1);
  assertSafe([request, apply, auditCalls]);
});

test('async request and apply writer path remains injected-only and outcome-independent', async () => {
  const auditCalls = [];
  const request = await processDataCorrectionRequestAsync(baseInput(), {
    decisionAuditWriter: async (payload) => {
      auditCalls.push(payload);

      return { ok: true };
    },
    includeDecisionAuditIntent: true,
  });
  const correctionCalls = [];
  const apply = await applyPreDepartureCorrectionAsync(baseInput(), {
    correctionWriter: async (payload) => {
      correctionCalls.push(payload);

      return { ok: true };
    },
    decisionAuditWriter: async (payload) => {
      auditCalls.push(payload);

      return { persisted: true };
    },
    includeDecisionAuditIntent: true,
  });

  assert.equal(request.response.allowed, true);
  assert.equal(apply.response.correctionApplied, true);
  assert.deepEqual(request.decisionAuditWriterResult, { status: 'recorded' });
  assert.deepEqual(apply.decisionAuditWriterResult, { status: 'recorded' });
  assert.equal(correctionCalls.length, 1);
  assertSafeRequestIntent(auditCalls[0]);
  assertSafeApplyIntent(auditCalls[1]);
  assertSafe([request, apply, auditCalls]);
});

test('request/apply separation remains unchanged for manual-handling and pre-departure apply branches', () => {
  const postDepartureInput = baseInput({
    appointmentContext: {
      appointmentId: 'appt_decision_audit_closure_887',
      arrived: false,
      engineerDeparted: true,
      engineerReceivedTask: true,
      routeStarted: true,
    },
  });
  const request = processDataCorrectionRequest(postDepartureInput, {
    decisionAuditWriter: createDecisionAuditWriter([]),
  });
  const apply = applyPreDepartureCorrection(postDepartureInput, {
    correctionWriter: createCorrectionWriter([]),
    decisionAuditWriter: createDecisionAuditWriter([]),
  });

  assert.equal(request.allowed, false);
  assert.equal(request.manualHandlingRequired, true);
  assert.equal(apply.status, 'blocked');
  assert.equal(apply.correctionApplied, false);
  assert.equal(apply.manualHandlingRequired, true);
  assertSafe([request, apply]);
});

test('Task887 unit test and closure guard import only test dependencies and safe service modules', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.task887UnitTest)), [
    '../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder',
    '../../src/dataCorrection/dataCorrectionPolicyEngine',
    '../../src/dataCorrection/dataCorrectionRequestService',
    '../../src/dataCorrection/preDepartureCorrectionApplicationService',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());

  assert.deepEqual(requireSpecifiers(fs.readFileSync(__filename, 'utf8')), [
    '../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder',
    '../../src/dataCorrection/dataCorrectionPolicyEngine',
    '../../src/dataCorrection/dataCorrectionRequestService',
    '../../src/dataCorrection/preDepartureCorrectionApplicationService',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
});
