'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  handler: 'src/customerAccess/customerServiceReportProjectionHandler.js',
  helper: 'src/customerAccess/customerAccessResolverDecisionHelper.js',
  wiringUnit: 'tests/customerAccess/customerAccessResolverDecisionHelperWiring.unit.test.js',
  helperUnit: 'tests/customerAccess/customerAccessResolverDecisionHelper.unit.test.js',
  helperBoundary: 'tests/customerAccess/customerAccessResolverDecisionHelperBoundary.static.test.js',
  contextSourceBoundary: 'tests/customerAccess/customerAccessContextSourceBoundary.static.test.js',
  task2304: 'docs/task-2304-customer-access-resolver-decision-helper-runtime-wiring-no-db-no-smoke-no-provider.md',
  task2305: 'docs/task-2305-customer-access-resolver-decision-helper-wiring-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

function functionBlock(source, functionName) {
  const signatureIndex = source.indexOf(`function ${functionName}`);

  assert.notEqual(signatureIndex, -1, `${functionName} should exist`);

  const bodyStartMatch = source
    .slice(signatureIndex)
    .match(new RegExp(`function ${functionName}\\([\\s\\S]*?\\) \\{`));

  assert.ok(bodyStartMatch, `${functionName} should have a function body`);

  const firstBrace = signatureIndex + bodyStartMatch[0].length - 1;

  let depth = 0;

  for (let index = firstBrace; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(signatureIndex, index + 1);
      }
    }
  }

  assert.fail(`${functionName} function body should close`);
}

function requireBindingBlock(source, specifier) {
  const escapedSpecifier = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`const \\{([\\s\\S]*?)\\} = require\\('${escapedSpecifier}'\\);`));

  assert.ok(match, `${specifier} should be required with destructured bindings`);

  return match[1];
}

function assertContainsAll(source, markers, label) {
  for (const marker of markers) {
    assert.match(source, new RegExp(marker), `${label} should keep ${marker}`);
  }
}

test('Task2305 static guard source test and evidence files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('projection handler imports both accepted resolver decision helper functions', () => {
  const handler = read(FILES.handler);
  const resolverBindings = requireBindingBlock(handler, './customerAccessResolverDecisionHelper');

  assert.match(resolverBindings, /buildCustomerAccessResolverDecision/);
  assert.match(resolverBindings, /buildCustomerAccessResolverDenyDecision/);
});

test('service-report response boundary gates allowed payload through resolver decision before safe envelope', () => {
  const handler = read(FILES.handler);
  const resolverDecisionFromServiceResult = functionBlock(handler, 'resolverDecisionFromServiceResult');
  const safeHttpEnvelopeFromServiceResult = functionBlock(handler, 'safeHttpEnvelopeFromServiceResult');

  assert.match(safeHttpEnvelopeFromServiceResult, /function safeHttpEnvelopeFromServiceResult\(serviceResult, customerAccessContext\)/);
  assert.match(safeHttpEnvelopeFromServiceResult, /resolverDecisionFromServiceResult\(\{\s*serviceResult,\s*customerAccessContext,\s*\}\)/);
  assert.match(resolverDecisionFromServiceResult, /buildCustomerAccessResolverDecision\(\{\s*customerAccessContext,\s*projection:\s*serviceResult\.data\.serviceReport,\s*\}\)/);
  assert.match(safeHttpEnvelopeFromServiceResult, /resolverDecision\.allowed !== true/);
  assert.match(safeHttpEnvelopeFromServiceResult, /!isPlainObject\(resolverDecision\.projection\)/);
  assert.match(safeHttpEnvelopeFromServiceResult, /return safeDenyEnvelope\(\);/);
  assert.match(safeHttpEnvelopeFromServiceResult, /serviceReport:\s*resolverDecision\.projection/);
  assert.match(safeHttpEnvelopeFromServiceResult, /buildCustomerServiceReportSafeEnvelope\(\{/);
});

test('deny and unavailable paths preserve generic safe-deny semantics through resolver deny helper', () => {
  const handler = read(FILES.handler);
  const safeDenyEnvelope = functionBlock(handler, 'safeDenyEnvelope');
  const resolverDecisionFromServiceResult = functionBlock(handler, 'resolverDecisionFromServiceResult');

  assert.match(safeDenyEnvelope, /buildCustomerAccessResolverDenyDecision\(\)/);
  assert.match(safeDenyEnvelope, /resolverDenyDecision\.messageKey === SAFE_DENY_MESSAGE_KEY/);
  assert.match(handler, /const SAFE_DENY_MESSAGE_KEY = 'customerAccess\.unavailable';/);
  assert.match(resolverDecisionFromServiceResult, /return buildCustomerAccessResolverDenyDecision\(\);/);
  assert.match(safeDenyEnvelope, /status:\s*'deny'/);
  assert.match(safeDenyEnvelope, /customerVisible:\s*false/);
  assert.match(safeDenyEnvelope, /data:\s*null/);
  assert.match(safeDenyEnvelope, /error:\s*\{\s*messageKey,\s*\}/);
});

test('existing customer-facing top-level response shape remains represented', () => {
  const handler = read(FILES.handler);
  const wiringUnit = read(FILES.wiringUnit);
  const task2304 = read(FILES.task2304);

  for (const source of [handler, wiringUnit, task2304]) {
    assert.match(source, /status/);
    assert.match(source, /messageKey/);
    assert.match(source, /customerVisible/);
    assert.match(source, /data\.serviceReport|data:\s*\{\s*serviceReport/);
  }
});

test('safe-deny context source and client-controlled identifier protections remain covered', () => {
  const wiringUnit = read(FILES.wiringUnit);
  const helperUnit = read(FILES.helperUnit);
  const contextSourceBoundary = read(FILES.contextSourceBoundary);
  const combined = [
    wiringUnit,
    helperUnit,
    contextSourceBoundary,
  ].join('\n');

  assertContainsAll(combined, [
    'body',
    'query',
    'headers',
    'cookies',
    'session',
    'user',
    'providerPayload',
    'debug',
    'env',
    'organizationId',
    'caseId',
    'reportId',
    'finalAppointmentId',
    'appointment_should_not_leak',
    'completion_report_should_not_leak',
    'field_service_report_should_not_leak',
    'case_exists_should_not_leak',
    'report_exists_should_not_leak',
    'raw_denial_reason_should_not_leak',
  ], 'Task2305 context/source coverage');
});

test('unsafe leakage sentinel coverage remains visible in wiring and helper tests', () => {
  const wiringUnit = read(FILES.wiringUnit);
  const helperUnit = read(FILES.helperUnit);
  const helperBoundary = read(FILES.helperBoundary);
  const combined = [
    wiringUnit,
    helperUnit,
    helperBoundary,
  ].join('\n');

  assertContainsAll(combined, [
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_completion_should_not_leak',
    'raw_fsr_should_not_leak',
    'repository_row_should_not_leak',
    'db_row_should_not_leak',
    'audit_context_should_not_leak',
    'provider_payload_should_not_leak',
    'ai_raw_should_not_leak',
    'rag_result_should_not_leak',
    'openai_should_not_leak',
    'vector_result_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'payment_should_not_leak',
    'invoice_should_not_leak',
    'final_appointment_should_not_leak',
    'customer_phone_should_not_leak|raw_phone_should_not_leak',
    'customer_address_should_not_leak|raw_address_should_not_leak',
    'full_address_should_not_leak',
    'signature_should_not_leak',
    'photo_should_not_leak',
    'debug_should_not_leak',
    'internal_should_not_leak|internal_actor_should_not_leak',
    'secret_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
  ], 'Task2305 unsafe leakage coverage');
});

test('static guard reads source test and doc text only without importing runtime or provider code', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.deepEqual(requireSpecifiers(source), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.match(source, /fs\.readFileSync/);
  assert.match(source, /src\/customerAccess\/customerServiceReportProjectionHandler\.js/);
  assert.match(source, /tests\/customerAccess\/customerAccessResolverDecisionHelperWiring\.unit\.test\.js/);
  assert.match(source, /docs\/task-2304-customer-access-resolver-decision-helper-runtime-wiring-no-db-no-smoke-no-provider\.md/);
  assert.doesNotMatch(source, /await import\(/);
});

test('Task2305 doc records no runtime change and no additional wiring authorization', () => {
  const doc = read(FILES.task2305);

  assert.match(doc, /static boundary guard only/);
  assert.match(doc, /No runtime\/source behavior changed/);
  assert.match(doc, /does not import or execute runtime, DB, repository, provider, route, server, listener, env, smoke, migration, AI\/RAG, billing, package, or package-lock code/);
  assert.match(doc, /No additional resolver decision helper runtime wiring beyond Task2304 is authorized/);
});
