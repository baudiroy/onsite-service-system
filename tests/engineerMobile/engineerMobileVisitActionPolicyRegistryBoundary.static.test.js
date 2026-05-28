'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const REGISTRY_FILE = 'src/engineerMobile/engineerMobileVisitActionPolicyRegistry.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionPolicyRegistry.unit.test.js';
const BOUNDARY_TEST_FILE = 'tests/engineerMobile/engineerMobileVisitActionPolicyRegistryBoundary.static.test.js';
const TASK_DOC = 'docs/task-1804-engineer-mobile-visit-action-policy-registry-no-db-no-global-mount.md';

const ALLOWED_POLICY_IMPORTS = [
  './engineerMobileStartTravelActionPolicy',
  './engineerMobileArriveActionPolicy',
  './engineerMobileStartWorkActionPolicy',
  './engineerMobileFinishWorkActionPolicy',
  './engineerMobileRecordVisitResultActionPolicy',
];

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

test('Task1804 allowed files exist', () => {
  for (const file of [REGISTRY_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('visit action policy registry imports only accepted policy modules', () => {
  const source = read(REGISTRY_FILE);

  assert.deepEqual(requireSpecifiers(source).sort(), ALLOWED_POLICY_IMPORTS.sort());
});

test('visit action policy registry stays isolated from forbidden runtimes', () => {
  const source = read(REGISTRY_FILE);

  for (const pattern of [
    /\bpg\b/i,
    /\bpool\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bexpress\b/i,
    /\bRouter\b/,
    /\bapp\./,
    /\.listen\s*\(/,
    /\brepository\b/i,
    /\bRepository\b/,
    /db:migrate/i,
    /\bpsql\b/i,
    /\bline\b/i,
    /\bsms\b/i,
    /\bemail\b/i,
    /\bwebhook\b/i,
    /\bai\b/i,
    /\brag\b/i,
    /\bbilling\b/i,
    /\bsettlement\b/i,
    /finalAppointmentId/,
  ]) {
    assert.doesNotMatch(source, pattern, `registry contains forbidden pattern ${pattern}`);
  }
});

test('visit action policy registry does not execute persistence provider route or completion workflow calls', () => {
  const source = read(REGISTRY_FILE);

  for (const pattern of [
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bALTER\b/i,
    /\bCREATE\b/i,
    /\.query\s*\(/,
    /\.save\s*\(/,
    /\.create\s*\(/,
    /\.update\s*\(/,
    /\.delete\s*\(/,
    /\bsend[A-Z]\w*\s*\(/,
    /\bcreateFieldServiceReport\s*\(/,
    /\bapproveFieldServiceReport\s*\(/,
    /\bpublishFieldServiceReport\s*\(/,
    /\bcompleteAppointment\s*\(/,
    /\bupdateAppointment\s*\(/,
    /\bcreateAppointment\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `registry contains forbidden behavior ${pattern}`);
  }
});

test('Task1804 doc records required no-runtime-expansion boundaries', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No DB',
    'No migration',
    'No global mount',
    'No provider sending',
    'No completion report creation',
    'No completion report approval',
    'No completion report publication',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const file of [REGISTRY_FILE, UNIT_TEST_FILE, BOUNDARY_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
