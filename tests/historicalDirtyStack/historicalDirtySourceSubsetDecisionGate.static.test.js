'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOC_PATH = path.join(
  REPO_ROOT,
  'docs/task-1239-historical-dirty-source-subset-decision-gate-appointment-dispatch-fsr-no-runtime-change.md'
);

const INCLUDED_SOURCE_PATHS = Object.freeze([
  'src/repositories/DispatchRepository.js',
  'src/repositories/FieldServiceReportRepository.js',
  'src/services/AppointmentService.js',
  'src/services/FieldServiceReportService.js',
]);

const EXCLUDED_PATHS = Object.freeze([
  'docs/task-105-backend-owned-final-appointment-inference-api-contract.md',
  'scripts/smoke/028_multi_dispatch_final_appointment_guard_smoke.js',
  'scripts/smoke/029_single_open_appointment_guard_smoke.js',
  'src/server.js',
]);

const INTENT_MARKERS = Object.freeze([
  'appointment / dispatch ownership validation',
  'final appointment consistency',
  'completed appointment guard',
  'Field Service Report completion atomic / first-transition behavior',
  'Field Service Report immutability after completion',
  '`finalAppointmentId` validation',
]);

const NO_GO_MARKERS = Object.freeze([
  'file modification',
  'cleanup / discard',
  'staging',
  'commit',
  'smoke execution',
  'DB execution',
]);

function readDoc() {
  return fs.readFileSync(DOC_PATH, 'utf8');
}

function sectionBetween(content, startHeading, endHeading) {
  const start = content.indexOf(startHeading);
  assert.notEqual(start, -1, `missing section: ${startHeading}`);

  const end = content.indexOf(endHeading, start + startHeading.length);
  assert.notEqual(end, -1, `missing end section: ${endHeading}`);

  return content.slice(start, end);
}

function gitStatusFor(paths) {
  return execFileSync('git', ['status', '--short', '--', ...paths], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
}

test('Task1239 decision gate doc exists', () => {
  assert.equal(fs.existsSync(DOC_PATH), true);
});

test('Task1239 doc records current latest commit', () => {
  const doc = readDoc();

  assert.match(doc, /b0b8703 Document historical dirty stack decision boundary/);
});

test('Task1239 source subset section contains exactly the 4 included source paths', () => {
  const doc = readDoc();
  const sourceSubsetSection = sectionBetween(
    doc,
    '## Source Subset Under Review',
    '## Explicit Exclusions'
  );

  for (const sourcePath of INCLUDED_SOURCE_PATHS) {
    assert.match(sourceSubsetSection, new RegExp(sourcePath.replaceAll('/', '\\/')));
  }

  for (const excludedPath of EXCLUDED_PATHS) {
    assert.doesNotMatch(sourceSubsetSection, new RegExp(excludedPath.replaceAll('/', '\\/')));
  }
});

test('Task1239 doc explicitly excludes docs, smoke, and server paths', () => {
  const doc = readDoc();
  const exclusionSection = sectionBetween(
    doc,
    '## Explicit Exclusions',
    '## Likely Intent From Task1236 And Task1237'
  );

  for (const excludedPath of EXCLUDED_PATHS) {
    assert.match(exclusionSection, new RegExp(excludedPath.replaceAll('/', '\\/')));
  }
});

test('Task1239 doc records source-subset intent and risk boundaries', () => {
  const doc = readDoc();

  for (const marker of INTENT_MARKERS) {
    assert.match(doc, new RegExp(marker.replaceAll('/', '\\/')));
  }

  assert.match(doc, /All 4 included files are source\/runtime files/);
  assert.match(doc, /targeted unit tests before any commit/);
  assert.match(doc, /DB\/repository behavior review before runtime acceptance/);
  assert.match(doc, /Smoke scripts must not be run as part of this gate/);
});

test('Task1239 doc records no-go for staging, commit, cleanup, smoke, and DB', () => {
  const doc = readDoc();
  const noGoSection = sectionBetween(doc, '## No-Go', '## Verification');

  for (const marker of NO_GO_MARKERS) {
    assert.match(noGoSection, new RegExp(marker.replaceAll('/', '\\/')));
  }
});

test('Task1239 static guard only checks path status for the source subset', () => {
  const status = gitStatusFor(INCLUDED_SOURCE_PATHS);

  for (const sourcePath of INCLUDED_SOURCE_PATHS) {
    assert.match(status, new RegExp(`^ M ${sourcePath}$`, 'm'));
    assert.equal(fs.existsSync(path.join(REPO_ROOT, sourcePath)), true);
  }
});
