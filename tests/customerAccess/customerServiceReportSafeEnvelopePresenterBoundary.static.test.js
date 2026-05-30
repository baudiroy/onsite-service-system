'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  presenter: 'src/customerAccess/customerServiceReportSafeEnvelopePresenter.js',
  unitTest: 'tests/customerAccess/customerServiceReportSafeEnvelopePresenter.unit.test.js',
  task2252: 'docs/task-2252-customer-access-safe-report-envelope-pure-helper-no-route-no-db-no-smoke-no-provider.md',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function objectFreezeArray(source, constantName) {
  const match = source.match(new RegExp(`${constantName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));

  assert.ok(match, `${constantName} should be declared as an Object.freeze array`);

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

test('Task2253 static guard source test and doc files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('safe envelope presenter exports only the accepted pure helper API', () => {
  const presenter = read(FILES.presenter);

  assert.match(presenter, /function buildCustomerServiceReportSafeEnvelope\(input\)/);
  assert.match(presenter, /function buildCustomerServiceReportSafeDenyEnvelope\(\)/);
  assert.match(presenter, /module\.exports = \{\s*buildCustomerServiceReportSafeDenyEnvelope,\s*buildCustomerServiceReportSafeEnvelope,\s*\};/);
});

test('safe envelope presenter keeps explicit report and attachment allowlists', () => {
  const presenter = read(FILES.presenter);

  assert.deepEqual(objectFreezeArray(presenter, 'SERVICE_REPORT_RESPONSE_KEYS'), [
    'customerReportReference',
    'caseReference',
    'serviceStatus',
    'appointmentWindow',
    'engineerDisplayName',
    'serviceSummary',
    'completionTime',
  ]);
  assert.deepEqual(objectFreezeArray(presenter, 'PUBLIC_ATTACHMENT_RESPONSE_KEYS'), [
    'attachmentId',
    'label',
    'mimeType',
  ]);
  assert.match(presenter, /const envelope = \{\s*ok: true,\s*status: 'allow',\s*messageKey: ALLOW_MESSAGE_KEY,\s*\};/);
  assert.match(presenter, /envelope\.publicAttachments = publicAttachments/);
});

test('deny unavailable envelope remains generic and safe', () => {
  const presenter = read(FILES.presenter);

  assert.match(presenter, /const DENY_MESSAGE_KEY = 'customerAccess\.unavailable'/);
  assert.match(presenter, /return \{\s*ok: false,\s*status: 'deny',\s*messageKey: DENY_MESSAGE_KEY,\s*\};/);
  assert.match(presenter, /input\.status === 'deny' \|\| input\.customerVisible === false/);
  assert.match(presenter, /return Object\.keys\(envelope\)\.length > 3\s*\?\s*envelope\s*:\s*buildCustomerServiceReportSafeDenyEnvelope\(\);/);
});

test('presenter source has no runtime DB provider AI billing env or route dependencies', () => {
  const presenter = read(FILES.presenter);

  assert.doesNotMatch(presenter, /require\(|import\s+/);
  assert.doesNotMatch(presenter, /pg\b|knex|sequelize|prisma|mysql|sqlite|repository|Repository|dbClient|query\(|SQL|select |insert |update |delete |transaction/i);
  assert.doesNotMatch(presenter, /routes?|controllers?|app\.|server|listen\(|express|Router|runtime/i);
  assert.doesNotMatch(presenter, /provider|LINE|SMS|email|webhook|push|axios|fetch\(|http\.request|https\.request/i);
  assert.doesNotMatch(presenter, /OpenAI|AI\/RAG|RAG|vector|embedding|model/i);
  assert.doesNotMatch(presenter, /billing|settlement|payment|invoice/i);
  assert.doesNotMatch(presenter, /process\.env|DATABASE_URL|Zeabur|secret|credential|config/i);
});

test('presenter source does not construct output from raw private internal fields', () => {
  const presenter = read(FILES.presenter);

  for (const forbidden of [
    'rawCase',
    'rawAppointment',
    'rawCompletionReport',
    'rawFieldServiceReport',
    'repositoryRow',
    'dbRow',
    'auditContext',
    'auditWriterResult',
    'auditActor',
    'providerPayload',
    'lineUserId',
    'sms',
    'email',
    'webhook',
    'finalAppointmentId',
    'internalEngineerId',
    'organizationInternal',
    'rawAddress',
    'rawSignature',
    'rawPhoto',
    'privateNote',
    'debug',
    'sql',
    'token',
    'password',
    'secret',
  ]) {
    assert.equal(presenter.includes(forbidden), false, `${forbidden} should not appear in presenter source`);
  }

  assert.doesNotMatch(presenter, /\.\.\.\s*(?:input|source|attachment)|Object\.assign\(/);
});

test('unit tests keep raw private system internal sentinels and immutability coverage visible', () => {
  const unitTest = read(FILES.unitTest);

  for (const marker of [
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_completion_should_not_leak',
    'raw_fsr_should_not_leak',
    'repository_row_should_not_leak',
    'db_row_should_not_leak',
    'audit_context_should_not_leak',
    'audit_writer_result_should_not_leak',
    'provider_payload_should_not_leak',
    'line_user_should_not_leak',
    'ai_raw_should_not_leak',
    'rag_result_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'payment_should_not_leak',
    'invoice_should_not_leak',
    'final_appointment_should_not_leak',
    'internal_engineer_should_not_leak',
    'organization_internal_should_not_leak',
    'raw_address_should_not_leak',
    'raw_signature_should_not_leak',
    'raw_photo_should_not_leak',
    'private_note_should_not_leak',
    'debug_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
  ]) {
    assert.match(unitTest, new RegExp(marker), `${marker} sentinel should remain covered`);
  }

  assert.match(unitTest, /input projection and attachments are not mutated/);
  assert.match(unitTest, /output shape never contains fields outside the approved envelope keys/);
});

test('Task2252 doc records pure helper no wiring and no DB/provider/smoke scope', () => {
  const doc = read(FILES.task2252);

  assert.match(doc, /standalone Customer Access safe report envelope presenter/);
  assert.match(doc, /does not wire the helper into routes, resolvers, handlers, repositories, DB, providers, smoke, app\/server, or runtime paths/);
  assert.match(doc, /Allowed top-level output fields/);
  assert.match(doc, /Allowed public attachment fields/);
  assert.match(doc, /does not import DB, repository implementations, providers, AI\/RAG, billing, routes, app\/server, env, or runtime modules/);
});
