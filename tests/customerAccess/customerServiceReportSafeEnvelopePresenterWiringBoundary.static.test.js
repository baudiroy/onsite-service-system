'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  handler: 'src/customerAccess/customerServiceReportProjectionHandler.js',
  task2301: 'docs/task-2301-customer-access-service-report-safe-envelope-presenter-wiring-no-db-no-smoke-no-provider.md',
  task2302: 'docs/task-2302-customer-access-service-report-safe-envelope-wiring-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function objectFreezeArray(source, constantName) {
  const match = source.match(new RegExp(`${constantName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));

  assert.ok(match, `${constantName} should be declared as an Object.freeze array`);

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

function functionBlock(source, functionName) {
  const signatureIndex = source.indexOf(`function ${functionName}`);

  assert.notEqual(signatureIndex, -1, `${functionName} should exist`);

  const firstBrace = source.indexOf('{', signatureIndex);

  assert.notEqual(firstBrace, -1, `${functionName} should have a function body`);

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

test('Task2302 static guard source doc and accepted wiring files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('projection handler imports both accepted safe envelope presenter helpers', () => {
  const handler = read(FILES.handler);
  const safeEnvelopePresenterBindings = requireBindingBlock(
    handler,
    './customerServiceReportSafeEnvelopePresenter',
  );

  assert.match(safeEnvelopePresenterBindings, /buildCustomerServiceReportSafeEnvelope/);
  assert.match(safeEnvelopePresenterBindings, /buildCustomerServiceReportSafeDenyEnvelope/);
});

test('safeHttpEnvelopeFromServiceResult routes allowed reports through safe presenter into data.serviceReport', () => {
  const handler = read(FILES.handler);
  const safeHttpEnvelopeFromServiceResult = functionBlock(handler, 'safeHttpEnvelopeFromServiceResult');

  assert.match(safeHttpEnvelopeFromServiceResult, /function safeHttpEnvelopeFromServiceResult\(serviceResult\)/);
  assert.match(safeHttpEnvelopeFromServiceResult, /buildCustomerServiceReportSafeEnvelope\(serviceResult\)/);
  assert.match(safeHttpEnvelopeFromServiceResult, /serviceReportFromSafeEnvelope\(safeReportEnvelope\)/);
  assert.match(safeHttpEnvelopeFromServiceResult, /status:\s*'allow'/);
  assert.match(safeHttpEnvelopeFromServiceResult, /messageKey:\s*ALLOW_MESSAGE_KEY/);
  assert.match(safeHttpEnvelopeFromServiceResult, /customerVisible:\s*true/);
  assert.match(safeHttpEnvelopeFromServiceResult, /data:\s*\{\s*serviceReport,\s*\}/);
});

test('generic deny and unavailable semantics stay owned by safe deny presenter wiring', () => {
  const handler = read(FILES.handler);
  const safeDenyEnvelope = functionBlock(handler, 'safeDenyEnvelope');
  const safeHttpEnvelopeFromServiceResult = functionBlock(handler, 'safeHttpEnvelopeFromServiceResult');

  assert.match(safeDenyEnvelope, /buildCustomerServiceReportSafeDenyEnvelope\(\)/);
  assert.match(safeDenyEnvelope, /safeReportDenyEnvelope\.messageKey === SAFE_DENY_MESSAGE_KEY/);
  assert.match(safeDenyEnvelope, /:\s*SAFE_DENY_MESSAGE_KEY/);
  assert.match(safeDenyEnvelope, /messageKey,/);
  assert.match(safeDenyEnvelope, /customerVisible:\s*false/);
  assert.match(safeDenyEnvelope, /data:\s*null/);
  assert.match(safeDenyEnvelope, /error:\s*\{\s*messageKey,\s*\}/);
  assert.match(handler, /const SAFE_DENY_MESSAGE_KEY = 'customerAccess\.unavailable';/);
  assert.match(safeHttpEnvelopeFromServiceResult, /return safeDenyEnvelope\(\);/);
});

test('top-level handler response shape and safe report allowlist remain explicit', () => {
  const handler = read(FILES.handler);

  assert.deepEqual(objectFreezeArray(handler, 'HTTP_ENVELOPE_KEYS'), [
    'customerVisible',
    'data',
    'error',
    'messageKey',
    'status',
  ]);
  assert.deepEqual(objectFreezeArray(handler, 'SERVICE_REPORT_KEYS'), [
    'appointmentWindow',
    'caseReference',
    'completionTime',
    'customerReportReference',
    'engineerDisplayName',
    'publicAttachments',
    'serviceStatus',
    'serviceSummary',
  ]);
  assert.deepEqual(objectFreezeArray(handler, 'SAFE_REPORT_ENVELOPE_KEYS'), [
    'ok',
    'status',
    'messageKey',
  ]);
  assert.match(handler, /const SAFE_REPORT_ENVELOPE_KEYS = Object\.freeze\(\[\s*'ok',\s*'status',\s*'messageKey',\s*\.\.\.SERVICE_REPORT_KEYS,\s*\]\);/);
});

test('raw service result projection row and attachment payloads are not spread into customer response data', () => {
  const handler = read(FILES.handler);
  const safeHttpEnvelopeFromServiceResult = functionBlock(handler, 'safeHttpEnvelopeFromServiceResult');
  const serviceReportFromSafeEnvelope = functionBlock(handler, 'serviceReportFromSafeEnvelope');

  for (const source of [safeHttpEnvelopeFromServiceResult, serviceReportFromSafeEnvelope]) {
    assert.doesNotMatch(source, /\.\.\.\s*(?:serviceResult|projection|row|serviceReport|attachment|input|source)/);
    assert.doesNotMatch(source, /Object\.assign\(/);
    assert.doesNotMatch(source, /serviceReport:\s*serviceResult(?:\.data)?(?:\.serviceReport)?/);
    assert.doesNotMatch(source, /data:\s*serviceResult\.data/);
  }

  assert.match(serviceReportFromSafeEnvelope, /for \(const key of SERVICE_REPORT_KEYS\)/);
  assert.match(serviceReportFromSafeEnvelope, /serviceReport\[key\] = envelope\[key\]/);
  assert.match(serviceReportFromSafeEnvelope, /isSafeServiceReport\(serviceReport\)/);
});

test('public attachments remain limited to attachmentId label and mimeType', () => {
  const handler = read(FILES.handler);
  const isSafePublicAttachment = functionBlock(handler, 'isSafePublicAttachment');

  assert.deepEqual(objectFreezeArray(handler, 'PUBLIC_ATTACHMENT_KEYS'), [
    'attachmentId',
    'label',
    'mimeType',
  ]);
  assert.match(isSafePublicAttachment, /hasOnlyAllowedKeys\(candidate, PUBLIC_ATTACHMENT_KEYS\)/);
  assert.match(isSafePublicAttachment, /PUBLIC_ATTACHMENT_KEYS\.every\(\(key\) => isSafeStringOrAbsent\(candidate\[key\]\)\)/);
});

test('this static guard reads source test and doc text only without importing runtime or provider code', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const requireSpecifiers = [...source.matchAll(/require\('([^']+)'\)/g)].map((match) => match[1]);

  assert.match(source, /fs\.readFileSync/);
  assert.match(source, /src\/customerAccess\/customerServiceReportProjectionHandler\.js/);
  assert.deepEqual(requireSpecifiers, [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.doesNotMatch(source, /await import\(/);
});

test('Task2302 doc records no runtime change and one-task-at-a-time authorization boundary', () => {
  const doc = read(FILES.task2302);

  assert.match(doc, /static boundary guard only/);
  assert.match(doc, /No runtime\/source behavior changed/);
  assert.match(doc, /does not import or execute runtime, DB, repository, provider, server, listener, or smoke code/);
  assert.match(doc, /PM must still authorize one exact task at a time/);
});
