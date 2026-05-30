'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const AUDIT_SIDE_CHANNEL_PATTERNS = Object.freeze([
  /engineerMobileAuditWriterAdapter/,
  /engineerMobileAuditEventBuilder/,
  /writeEngineerMobileAuditEvent/,
  /buildEngineerMobileAuditEvent/,
]);

const ALLOWED_AUDIT_INTEGRATION_FILES = new Set([
  'src/controllers/engineerMobileController.js',
  'src/controllers/engineerMobileTaskDetailController.js',
  'src/routes/engineerMobileVisitActionRoutes.js',
  'src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js',
  'src/engineerMobile/engineerMobileAuditEventBuilder.js',
  'src/engineerMobile/engineerMobileAuditWriterAdapter.js',
]);

const PROVIDER_DB_LAYER_FILES = Object.freeze([
  'src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js',
  'src/engineerMobile/engineerMobileTaskListReadRepository.js',
  'src/engineerMobile/engineerMobileTaskDetailReadRepository.js',
  'src/engineerMobile/engineerMobileReadModelRepository.js',
  'src/engineerMobile/engineerMobileReadRepository.js',
  'src/engineerMobile/engineerMobileTaskListReadModelMapper.js',
  'src/engineerMobile/engineerMobileTaskDetailReadModelMapper.js',
  'src/engineerMobile/engineerMobileVisitActionRepositoryAdapter.js',
  'src/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapter.js',
  'src/engineerMobile/engineerMobileVisitActionRepositoryPersistencePortBridge.js',
  'src/engineerMobile/engineerMobileVisitActionIntegratedPersistenceWriter.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.js',
  'src/engineerMobile/engineerMobileReadProviderOptionsComposer.js',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function listSourceFiles(dir) {
  const absoluteDir = path.join(repoRoot, dir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(relativePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

function containsAuditSideChannelReference(source) {
  return AUDIT_SIDE_CHANNEL_PATTERNS.some((pattern) => pattern.test(source));
}

test('provider DB repository and read-model layers do not import or call Engineer Mobile audit side channel', () => {
  for (const file of PROVIDER_DB_LAYER_FILES) {
    const source = read(file);

    assert.equal(
      containsAuditSideChannelReference(source),
      false,
      `${file} must remain audit side-channel free`,
    );
  }
});

test('only approved route controller and composition boundaries reference the audit side-channel primitives', () => {
  const filesWithAuditReferences = listSourceFiles('src')
    .filter((file) => containsAuditSideChannelReference(read(file)))
    .sort();

  assert.deepEqual(filesWithAuditReferences, [...ALLOWED_AUDIT_INTEGRATION_FILES].sort());
});
