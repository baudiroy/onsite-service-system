'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_FILES = [
  {
    label: 'draftReader',
    relativePath: '../../src/repairIntake/repairIntakeDraftReaderPortAdapter.js',
  },
  {
    label: 'casePlanner',
    relativePath: '../../src/repairIntake/repairIntakeCasePlannerPortAdapter.js',
  },
  {
    label: 'caseCreator',
    relativePath: '../../src/repairIntake/repairIntakeCaseCreatorPortAdapter.js',
  },
  {
    label: 'auditWriter',
    relativePath: '../../src/repairIntake/repairIntakeAuditWriterPortAdapter.js',
  },
  {
    label: 'idempotencyPort',
    relativePath: '../../src/repairIntake/repairIntakeIdempotencyPortAdapter.js',
  },
  {
    label: 'applicationService',
    relativePath: '../../src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  },
  {
    label: 'controller',
    relativePath: '../../src/repairIntake/repairIntakeDraftToCaseController.js',
  },
  {
    label: 'apiModule',
    relativePath: '../../src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  },
  {
    label: 'httpMountAdapter',
    relativePath: '../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js',
  },
];

function absolutePath(relativePath) {
  return path.join(__dirname, relativePath);
}

function readSources() {
  return SOURCE_FILES.map((file) => ({
    ...file,
    sourcePath: absolutePath(file.relativePath),
    source: fs.readFileSync(absolutePath(file.relativePath), 'utf8'),
  }));
}

function aggregateSource(files) {
  return files.map((file) => file.source).join('\n');
}

function sourceWithoutUnsafeFieldLists(source) {
  return source.replace(
    /const\s+UNSAFE_[A-Z_]*FIELD_NAMES\s*=\s*new Set\(\[[\s\S]*?\]\);/g,
    'const UNSAFE_FIELD_NAMES = new Set([]);',
  );
}

function runtimeSource(files) {
  return files
    .map((file) => sourceWithoutUnsafeFieldLists(file.source))
    .join('\n');
}

function assertIncludes(source, marker) {
  assert.equal(source.includes(marker), true, `missing source marker: ${marker}`);
}

test('aggregate static guard reads the full pure-port source chain', () => {
  for (const file of SOURCE_FILES) {
    assert.equal(fs.existsSync(absolutePath(file.relativePath)), true, `missing ${file.label}`);
  }
});

test('full pure-port chain keeps expected factory and seam markers', () => {
  const source = aggregateSource(readSources());

  for (const marker of [
    'createRepairIntakeDraftReaderPortAdapter',
    'createRepairIntakeCasePlannerPortAdapter',
    'createRepairIntakeCaseCreatorPortAdapter',
    'createRepairIntakeAuditWriterPortAdapter',
    'createRepairIntakeIdempotencyPortAdapter',
    'createRepairIntakeDraftToCaseApplicationService',
    'createRepairIntakeDraftToCaseController',
    'createRepairIntakeDraftToCaseApiModule',
    'mountRepairIntakeDraftToCaseApiModule',
  ]) {
    assertIncludes(source, marker);
  }
});

test('full pure-port chain keeps expected injected port markers', () => {
  const source = aggregateSource(readSources());

  for (const marker of [
    'draftRepository.findDraftForConversion',
    'planningPolicy.planCaseFromDraft',
    'caseCreationPort.createCaseFromDraft',
    'auditPort.recordDraftToCaseDecision',
    'idempotencyStore.findExistingDraftToCaseResult',
    'idempotencyStore.recordDraftToCaseResult',
  ]) {
    assertIncludes(source, marker);
  }
});

test('full pure-port chain keeps sanitization and boundary concepts on real source markers', () => {
  const source = aggregateSource(readSources());

  for (const marker of [
    'function sanitizeRequestInput',
    'function sanitizeRequestValue',
    'function sanitizeInputValue',
    'function sanitizeOutputValue',
    'function sanitizeHandlerOutputValue',
    'function createInputPayload',
    'function createLookupInput',
    'function createRecordInput',
    'function createPlanPayload',
    'function createCasePayload',
    'function createAuditPayload',
    'function createIdempotencyRecordPayload',
    'function planEnvelope',
    'function submitEnvelope',
    'function replayResult',
    'function recordEnvelope',
    'function submitPreconditionFailure',
    'function idempotentReplayEnvelope',
    'function existingResultIsSuccessful',
    'async function callIdempotencyPort',
    'catch (error)',
    'return safeFailure',
    'return createFailure',
    'const SAFE_HTTP_METHOD_KEYS = new Set([\'post\'])',
    'function normalizeMethod',
    'function normalizeRoutePath',
    'routeKeys.has(routeKey)',
    'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_DUPLICATE_ROUTE',
  ]) {
    assertIncludes(source, marker);
  }
});

test('full pure-port runtime body avoids forbidden repository, DB, provider, AI, and global mount coupling markers', () => {
  const source = runtimeSource(readSources());

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
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
  ]) {
    assert.equal(source.includes(marker), false, `forbidden runtime marker found: ${marker}`);
  }
});

test('full pure-port chain keeps forbidden sensitive markers only as unsafe-field redaction entries', () => {
  const source = aggregateSource(readSources());
  const runtimeOnlySource = runtimeSource(readSources());

  assert.equal(source.includes('finalAppointmentId'), true);
  assert.equal(source.includes('lineaccesstoken'), true);
  assert.equal(source.includes('lineuserid'), true);
  assert.equal(runtimeOnlySource.includes('finalAppointmentId'), false);
  assert.equal(runtimeOnlySource.includes('lineaccesstoken'), false);
  assert.equal(runtimeOnlySource.includes('lineuserid'), false);
});
