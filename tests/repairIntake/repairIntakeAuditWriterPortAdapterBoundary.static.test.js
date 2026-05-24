'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeAuditWriterPortAdapter.js',
);

function readSource() {
  return readFileSync(sourcePath, 'utf8');
}

test('auditWriter adapter source keeps factory and error export shape', () => {
  const source = readSource();

  assert.match(source, /class RepairIntakeAuditWriterPortAdapterError extends Error/);
  assert.match(source, /function createRepairIntakeAuditWriterPortAdapter/);
  assert.match(source, /createRepairIntakeAuditWriterPortAdapter,/);
  assert.match(source, /RepairIntakeAuditWriterPortAdapterError,/);
  assert.match(source, /auditPort\.recordDraftToCaseDecision/);
  assert.match(source, /async function recordDraftToCaseDecision/);
});

test('auditWriter adapter source keeps dependency shape validation at creation', () => {
  const source = readSource();

  assert.match(source, /function isObject/);
  assert.match(source, /if \(!isObject\(auditPort\) \|\| typeof auditPort\.recordDraftToCaseDecision !== 'function'\)/);
  assert.match(source, /REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_AUDIT_PORT_REQUIRED/);
});

test('auditWriter adapter source keeps input shape guard for plain object input and required summaries', () => {
  const source = readSource();

  assert.match(source, /if \(!isObject\(input\) \|\| !isObject\(input\.draft\) \|\| !isObject\(input\.plan\) \|\| !isObject\(input\.caseRef\)\)/);
  assert.match(source, /REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_INPUT_INVALID/);
  assert.match(source, /provide_valid_audit_input/);
  assert.match(source, /createAuditInput/);
  assert.match(source, /function draftSummary/);
  assert.match(source, /function planSummary/);
  assert.match(source, /function caseRefSummary/);
  assert.match(source, /firstSafeString/);
});

test('auditWriter adapter source keeps safe audit input and envelope extraction', () => {
  const source = readSource();

  assert.match(source, /function createAuditInput/);
  assert.match(source, /function auditEnvelope/);
  assert.match(source, /function failureEnvelope/);
  assert.match(source, /sanitizeValue\(input\)/);
  assert.match(source, /draftId: firstSafeString/);
  assert.match(source, /organizationId: firstSafeString/);
  assert.match(source, /tenantId: firstSafeString/);
  assert.match(source, /requestId: firstSafeString/);
  assert.match(source, /actor: input\.actor/);
  assert.match(source, /metadata: input\.metadata/);
  assert.match(source, /warnings: input\.warnings/);
  assert.match(source, /safeArray/);
  assert.match(source, /sanitizeValue\(\{/);
});

test('auditWriter adapter source keeps sync thrown and async rejected audit sanitization', () => {
  const source = readSource();

  assert.match(source, /try \{/);
  assert.match(source, /await auditPort\.recordDraftToCaseDecision\(auditInput\)/);
  assert.match(source, /catch \(error\)/);
  assert.equal(source.includes('error.message'), false);
  assert.equal(source.includes('error.stack'), false);
  assert.equal(source.includes('throw error'), false);
  assert.match(source, /return failureEnvelope\('REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED'\)/);
});

test('auditWriter adapter source keeps expected sanitized reason codes', () => {
  const source = readSource();

  for (const reasonCode of [
    'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_AUDIT_PORT_REQUIRED',
    'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_INPUT_INVALID',
    'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED',
    'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORDED',
  ]) {
    assert.equal(source.includes(reasonCode), true, `missing reasonCode ${reasonCode}`);
  }
});

test('auditWriter adapter source avoids forbidden runtime and repository coupling markers', () => {
  const source = readSource();

  for (const marker of [
    "require('../db')",
    "require('../repositories')",
    "require('../routes')",
    "require('../controllers')",
    'express()',
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'DATABASE_URL',
    'lineAccessToken',
    'lineUserid',
    'lineUserId',
    'finalAppointmentId',
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM',
    'SELECT ',
    'new DraftRepository',
    'new CaseRepository',
    'Pool(',
    'pg',
    'knex',
    'sequelize',
    'mongoose',
  ]) {
    assert.equal(source.includes(marker), false, `forbidden marker found: ${marker}`);
  }
});
