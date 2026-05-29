'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const AUDIT_EVENT_BUILDER_FILE = 'src/engineerMobile/engineerMobileVisitActionAuditEventBuilder.js';
const AUDIT_WRITER_ADAPTER_FILE = 'src/engineerMobile/engineerMobileVisitActionAuditWriterAdapter.js';
const RUNTIME_BOOTSTRAP_FILE = 'src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.js';
const INTEGRATED_WRITER_FILE = 'src/engineerMobile/engineerMobileVisitActionIntegratedPersistenceWriter.js';
const TASK_DOC = 'docs/task-1872-engineer-mobile-visit-action-audit-log-boundary.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
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

function assertForbiddenRuntimeBoundaries(source, label) {
  for (const pattern of [
    /\bpg\b/i,
    /\bpool\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bfs\b/,
    /\bpath\b/,
    /\bexpress\b/i,
    /\bRouter\b/,
    /\bapp\.js\b/,
    /\bserver\.js\b/,
    /\.listen\s*\(/,
    /db:migrate/i,
    /\bpsql\b/i,
    /\bSELECT\b/i,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /\bline\b/i,
    /\bsms\b/i,
    /\bemail\b/i,
    /\bwebhook\b/i,
    /\bprovider\b/i,
    /\bopenai\b/i,
    /\brag\b/i,
    /\bbilling\b/i,
    /\bsettlement\b/i,
    /completionReport/i,
    /fieldServiceReport/i,
    /finalAppointmentId\s*=/,
    /final_appointment_id\s*=/i,
    /publish/i,
    /customerVisiblePublication/i,
  ]) {
    assert.doesNotMatch(source, pattern, `${label} contains forbidden pattern ${pattern}`);
  }
}

test('Task1872 audit boundary files and documentation exist', () => {
  for (const file of [
    AUDIT_EVENT_BUILDER_FILE,
    AUDIT_WRITER_ADAPTER_FILE,
    RUNTIME_BOOTSTRAP_FILE,
    INTEGRATED_WRITER_FILE,
    TASK_DOC,
  ]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('audit builder and writer remain injected and isolated from runtime dependencies', () => {
  const builderSource = read(AUDIT_EVENT_BUILDER_FILE);
  const writerSource = read(AUDIT_WRITER_ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(builderSource), []);
  assert.deepEqual(requireSpecifiers(writerSource), [
    './engineerMobileVisitActionAuditEventBuilder',
  ]);
  assertForbiddenRuntimeBoundaries(builderSource, AUDIT_EVENT_BUILDER_FILE);
  assertForbiddenRuntimeBoundaries(writerSource, AUDIT_WRITER_ADAPTER_FILE);
});

test('runtime audit integration remains delegated through injected writer boundaries', () => {
  const bootstrapSource = read(RUNTIME_BOOTSTRAP_FILE);
  const integratedWriterSource = read(INTEGRATED_WRITER_FILE);

  for (const required of [
    'createEngineerMobileVisitActionAuditWriterAdapter',
    'auditEventWriter',
    'auditIntentWriterAdapter',
    'integratedAuditIntentFrom',
    'requestId',
  ]) {
    assert.match(bootstrapSource, new RegExp(required));
  }

  for (const required of [
    'buildEngineerMobileVisitActionAuditEvent',
    'auditEventEnvelopeFromBuild',
    'requestId',
  ]) {
    assert.match(integratedWriterSource, new RegExp(required));
  }
});

test('Task1872 doc records safe audit fields status semantics and exclusions', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Implementation boundary',
    'action',
    'allowed status',
    'actorId',
    'organizationId',
    'caseId',
    'appointmentId',
    'requestId',
    'No raw DB rows',
    'No secrets',
    'No DATABASE_URL',
    'No stack traces',
    'No provider tokens',
    'No customer-visible publication',
    'No Completion Report',
    'No Field Service Report',
    'No finalAppointmentId mutation',
    'No DB execution',
    'No migration',
    'No seed',
    'No provider sending',
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
