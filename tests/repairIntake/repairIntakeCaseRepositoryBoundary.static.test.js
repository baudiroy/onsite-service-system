'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryModule = require('../../src/repairIntake/repairIntakeCaseRepository');

const sourcePath = path.join(__dirname, '../../src/repairIntake/repairIntakeCaseRepository.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const lowerSource = source.toLowerCase();

function assertNotContains(markers, label = 'source') {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} must not contain ${marker}`);
  }
}

function assertLowerNotContains(markers, label = 'source') {
  for (const marker of markers) {
    assert.equal(lowerSource.includes(marker.toLowerCase()), false, `${label} must not contain ${marker}`);
  }
}

test('factory and method shape are present', () => {
  assert.equal(typeof repositoryModule.createRepairIntakeCaseRepository, 'function');
  assert.equal(typeof repositoryModule.RepairIntakeCaseRepositoryError, 'function');

  const repository = repositoryModule.createRepairIntakeCaseRepository({
    caseCreationPort: {
      async createCaseFromDraft() {
        return { caseId: 'case-static-1' };
      },
    },
  });

  assert.equal(typeof repository.createCaseFromDraft, 'function');
});

test('source is injected dependency only', () => {
  assert.match(source, /caseCreationPort/);
  assert.match(source, /caseService/);
  assert.match(source, /caseRepository/);
  assert.match(source, /dependency\.createCaseFromDraft/);
  assert.doesNotMatch(source, /require\s*\(/);
});

test('source has no DB, repository, env, or SQL coupling', () => {
  assertNotContains([
    '../db',
    '../repositories',
    'src/db',
    'src/repositories',
    'process.env',
    'DATABASE_URL',
  ]);

  assertNotContains([
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'UPSERT',
    'MERGE',
    'DROP TABLE',
    'TRUNCATE',
    'ALTER TABLE DROP',
  ], 'source SQL boundary');
});

test('source preserves Case boundary and avoids side-effect markers', () => {
  assertNotContains([
    'finalAppointmentId',
    'final_appointment_id',
    'appointmentRepository',
    'createAppointment',
    'updateAppointment',
    'createServiceReport',
    'fieldServiceReportRepository',
    'FieldServiceReport',
    'publish',
    'sendProvider',
    'provider.send',
  ], 'source case boundary');
});

test('source contains sanitizer markers and unsafe family blocks', () => {
  assert.match(source, /UNSAFE_FIELD_NAMES/);
  assert.match(source, /fieldIsUnsafe/);
  assert.match(source, /sanitizeNestedValue/);
  assert.match(source, /safeString/);
  assert.match(source, /safeObject/);
  assert.match(source, /safeArray/);

  for (const marker of [
    'rawrow',
    'rawrows',
    "'s' + 'ql'",
    'query',
    'authorization',
    'headers',
    'cookie',
    'phone',
    'address',
    'customer',
    'lineaccesstoken',
    'lineuserid',
    'stack',
    'error',
  ]) {
    assert.match(lowerSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('source has no forbidden app, route, provider, admin, AI, billing, or package coupling', () => {
  assertNotContains([
    '../app',
    '../server',
    '../routes',
    '../controllers',
    'src/app',
    'src/server',
    'src/routes',
    'src/controllers',
    'package.json',
  ]);

  assertLowerNotContains([
    'provider',
    'admin',
    'billing',
  ]);

  assert.equal(/\bAI\b/.test(source), false, 'source must not contain AI marker');
});
