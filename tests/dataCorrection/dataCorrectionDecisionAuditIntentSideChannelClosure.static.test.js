'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CORRECTION_FIELD_GROUPS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  processDataCorrectionRequest,
} = require('../../src/dataCorrection/dataCorrectionRequestService');
const {
  applyPreDepartureCorrection,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  builder: 'src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  route: 'src/routes/dataCorrectionRoutes.js',
  controller: 'src/controllers/dataCorrectionController.js',
  orchestrator: 'src/dataCorrection/dataCorrectionGovernanceOrchestrator.js',
  task869Doc: 'docs/task-869-data-correction-decision-audit-intent-builder-no-audit-write-no-db.md',
  task870Doc: 'docs/task-870-data-correction-decision-audit-intent-side-channel-no-audit-write-no-api-shape-change.md',
  task869Test: 'tests/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.unit.test.js',
  task870Test: 'tests/dataCorrection/dataCorrectionDecisionAuditIntentSideChannel.unit.test.js',
});

const UNSAFE_NEEDLES = Object.freeze([
  'from value should not leak',
  '0912-345-678',
  '新北市板橋區文化路一段88號5樓',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'postgres://unsafe',
  'Error: unsafe stack',
  'SELECT * FROM unsafe',
  'full payload should not leak',
  'internal note should not leak',
  'audit raw payload should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'apt_final_unsafe_001',
  'fromValue',
  'toValue',
  'rawPhone',
  'rawAddress',
  'finalAppointmentId',
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

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_dc_side_channel_closure_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_dc_side_channel_closure_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_dc_side_channel_closure_001',
      organizationId: 'org_dc_side_channel_closure_001',
    },
    appointmentContext: {
      appointmentId: 'appt_dc_side_channel_closure_001',
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
      rawPhone: '0912-345-678',
      rawAddress: '新北市板橋區文化路一段88號5樓',
      rawLineUserId: 'LINE-RAW-USER-ID',
      internalNote: 'internal note should not leak',
      auditRawPayload: 'audit raw payload should not leak',
      aiRawPayload: 'ai raw payload should not leak',
      billingInternalData: 'billing internal should not leak',
      settlementInternalData: 'settlement internal should not leak',
      finalAppointmentId: 'apt_final_unsafe_001',
    },
    fullPayload: 'full payload should not leak',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'postgres://unsafe',
    stack: 'Error: unsafe stack',
    rawSql: 'SELECT * FROM unsafe',
    ...overrides,
  };
}

function assertNoUnsafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const needle of UNSAFE_NEEDLES) {
    assert.equal(serialized.includes(needle), false, `unexpected unsafe output: ${needle}`);
  }
}

test('Task869 and Task870 evidence files exist before side-channel closure', () => {
  [
    FILES.builder,
    FILES.task869Doc,
    FILES.task870Doc,
    FILES.task869Test,
    FILES.task870Test,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('Task870 document records opt-in internal side-channel and no public API change', () => {
  const doc = read(FILES.task870Doc);

  [
    'opt-in internal side-channel',
    'includeDecisionAuditIntent',
    'includeAuditIntent',
    'No Public API Shape Change',
    'No New Side Effects',
    'auditWritten: false',
    'default request/apply output does not include `auditIntent`',
    'does not modify routes, controllers, DTOs, app/server wiring',
    'add DB persistence, repository wiring, migration, DDL, psql, dry-run, or apply',
  ].forEach((phrase) => {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  });
});

test('side-channel flags are internal opt-in and default response shape remains unchanged', () => {
  const requestDefault = processDataCorrectionRequest(baseInput());
  const requestOptIn = processDataCorrectionRequest(baseInput(), {
    includeDecisionAuditIntent: true,
  });
  const applyDefault = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
  });
  const applyOptIn = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
    includeAuditIntent: true,
  });

  assert.equal(requestDefault.auditIntent, undefined);
  assert.equal(requestDefault.response, undefined);
  assert.equal(requestDefault.allowed, true);
  assert.equal(applyDefault.auditIntent, undefined);
  assert.equal(applyDefault.response, undefined);
  assert.equal(applyDefault.correctionApplied, true);

  assert.equal(requestOptIn.response.allowed, true);
  assert.equal(requestOptIn.auditIntent.auditWritten, false);
  assert.equal(applyOptIn.response.correctionApplied, true);
  assert.equal(applyOptIn.auditIntent.auditWritten, false);
  assertNoUnsafeOutput([requestDefault, requestOptIn, applyDefault, applyOptIn]);
});

test('route controller and orchestrator do not expose auditIntent or side-channel options', () => {
  for (const relativePath of [FILES.route, FILES.controller, FILES.orchestrator]) {
    const source = read(relativePath);

    assert.doesNotMatch(source, /auditIntent/);
    assert.doesNotMatch(source, /includeDecisionAuditIntent/);
    assert.doesNotMatch(source, /includeAuditIntent/);
    assert.doesNotMatch(source, /dataCorrectionDecisionAuditIntentBuilder/);
  }
});

test('side-channel source imports only pure local builder and existing Data Correction dependencies', () => {
  const requestSpecifiers = requireSpecifiers(read(FILES.requestService));
  const applySpecifiers = requireSpecifiers(read(FILES.applyService));
  const builderSpecifiers = requireSpecifiers(read(FILES.builder));

  assert.deepEqual(requestSpecifiers, [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
  ]);
  assert.deepEqual(applySpecifiers, [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
    './dataCorrectionRequestService',
  ]);
  assert.deepEqual(builderSpecifiers, []);

  const forbiddenImportPattern = /(?:^|\/)(?:db|pool|repositories?|routes?|controllers?|providers?|ai|rag|vector|billing|settlement|admin|config)(?:\/|$)|transaction|line|sms|email|push|provider|process\.env/i;

  for (const specifier of [...requestSpecifiers, ...applySpecifiers, ...builderSpecifiers]) {
    assert.equal(forbiddenImportPattern.test(specifier), false, `forbidden import: ${specifier}`);
  }
});

test('side-channel composition does not add audit writer sink DB provider AI or logging calls', () => {
  const combined = [
    read(FILES.builder),
    read(FILES.requestService),
    read(FILES.applyService),
  ].join('\n');

  [
    /process\.env/,
    /console\./,
    /fetch\(/,
    /createServer/,
    /app\.listen/,
    /new\s+Pool/,
    /pool\.query/,
    /client\.query/,
    /INSERT\s+INTO/i,
    /UPDATE\s+/i,
    /DELETE\s+FROM/i,
    /require\(['"].*provider/i,
    /require\(['"].*ai/i,
    /require\(['"].*rag/i,
    /require\(['"].*billing/i,
    /require\(['"].*settlement/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(combined), false, `forbidden side-channel pattern: ${pattern}`);
  });
});

test('request/apply branch separation remains closed after side-channel wiring', () => {
  const requestSource = read(FILES.requestService);
  const applySource = read(FILES.applyService);
  const orchestratorSource = read(FILES.orchestrator);

  assert.doesNotMatch(requestSource, /correctionWriter/);
  assert.doesNotMatch(requestSource, /correctionApplied\s*:\s*true/);
  assert.match(applySource, /processDataCorrectionRequest\(input,\s*\{\s*auditWriter:\s*options\.auditWriter,\s*\}\)/);
  assert.match(applySource, /writerResults\.correction\s*=\s*callInjectedWriter/);
  assert.match(applySource, /correctionApplied:\s*true/);
  assert.match(orchestratorSource, /DATA_CORRECTION_REQUEST:\s*'data_correction_request'/);
  assert.match(orchestratorSource, /PRE_DEPARTURE_APPLY:\s*'pre_departure_apply'/);
});

test('auditIntent output is safe metadata only and excludes response writer internals by default', () => {
  const writerCalls = [];
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'appt_dc_side_channel_closure_001',
      engineerDeparted: true,
      engineerReceivedTask: true,
    },
  }), {
    auditWriter(payload) {
      writerCalls.push(payload);

      return { ok: true, persisted: true, unsafe: 'secret-value' };
    },
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.manualHandlingRequired, true);
  assert.equal(result.auditIntent.auditWritten, false);
  assert.equal(result.auditIntent.eventType, 'data_correction_request_manual_handling');
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditIntent, 'writerResults'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditIntent, 'response'), false);
  assert.equal(writerCalls.length, 1);
  assertNoUnsafeOutput(result.auditIntent);
});

test('closure guard itself does not import runtime or sensitive dependencies', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    '../../src/dataCorrection/dataCorrectionPolicyEngine',
    '../../src/dataCorrection/dataCorrectionRequestService',
    '../../src/dataCorrection/preDepartureCorrectionApplicationService',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
  assert.equal(specifiers.some((specifier) => /db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector|billing|settlement/i.test(specifier)), false);
});
