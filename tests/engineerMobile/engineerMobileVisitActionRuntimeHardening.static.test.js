'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HARDENED_SOURCE_FILES = Object.freeze([
  'src/engineerMobile/engineerMobileVisitActionCommandPlanner.js',
  'src/engineerMobile/engineerMobileVisitActionApplicationService.js',
  'src/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder.js',
  'src/engineerMobile/engineerMobileVisitActionTransitionWriterAdapter.js',
  'src/engineerMobile/engineerMobileVisitActionIntegratedPersistenceWriter.js',
  'src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap.js',
  'src/engineerMobile/engineerMobileVisitActionRepositoryContract.js',
  'src/engineerMobile/engineerMobileVisitActionPersistencePortContract.js',
  'src/engineerMobile/engineerMobileVisitActionRepositoryAdapter.js',
]);

const TASK_DOC = 'docs/task-1873-engineer-mobile-visit-action-runtime-hardening.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

test('Task1873 hardened source files and documentation exist', () => {
  for (const file of [...HARDENED_SOURCE_FILES, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('Task1873 hardened sources do not introduce DB runtime provider or publication behavior', () => {
  for (const file of HARDENED_SOURCE_FILES) {
    const source = read(file);

    for (const pattern of [
      /DATABASE_URL/,
      /process\.env/,
      /require\(['"].*pg['"]\)/i,
      /\bPool\b/,
      /db:migrate/i,
      /\bpsql\b/i,
      /CREATE\s+TABLE/i,
      /ALTER\s+TABLE/i,
      /DROP\s+TABLE/i,
      /\bline\b/i,
      /\bsms\b/i,
      /\bemail\b/i,
      /\bwebhook\b/i,
      /\bopenai\b/i,
      /\brag\b/i,
      /\bbilling\b/i,
      /\bsettlement\b/i,
      /createCompletionReport/i,
      /createFieldServiceReport/i,
      /publishFieldServiceReport/i,
      /approveFieldServiceReport/i,
      /customerVisiblePublication\s*=/,
      /finalAppointmentId\s*=/,
      /final_appointment_id\s*=/i,
    ]) {
      assert.doesNotMatch(source, pattern, `${file} contains forbidden pattern ${pattern}`);
    }
  }
});

test('Task1873 doc records requestId hardening and explicit runtime boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'requestId propagation',
    'Command planner',
    'Application service',
    'Transition patch builder',
    'Integrated persistence writer',
    'Runtime bootstrap',
    'Repository adapter',
    'No DB execution',
    'No SQL execution',
    'No migration',
    'No seed',
    'No runtime server start',
    'No provider sending',
    'No Completion Report',
    'No Field Service Report',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
