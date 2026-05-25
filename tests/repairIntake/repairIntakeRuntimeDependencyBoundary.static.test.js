'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_FILES = [
  {
    key: 'runtimeDependencyFactory',
    path: '../../src/repairIntake/repairIntakeDraftCaseRuntimeDependencyFactory.js',
  },
  {
    key: 'injectedRuntimeComposer',
    path: '../../src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js',
  },
  {
    key: 'injectedRouteComposition',
    path: '../../src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js',
  },
];

function sourcePath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

function readSource(sourceFile) {
  return fs.readFileSync(sourcePath(sourceFile.path), 'utf8');
}

function stripForbiddenInputDenyList(source) {
  return source.replace(
    /const FORBIDDEN_INPUT_FIELDS = new Set\(\[[\s\S]*?\]\);/,
    'const FORBIDDEN_INPUT_FIELDS = new Set([]);',
  );
}

function assertForbiddenMarkersAbsent(sourceFile, markers) {
  const source = readSource(sourceFile);

  for (const marker of markers) {
    assert.equal(
      source.includes(marker),
      false,
      `${sourceFile.key} must not contain forbidden marker ${marker}`,
    );
  }
}

test('runtime dependency boundary reads scoped source files only', () => {
  for (const sourceFile of SOURCE_FILES) {
    assert.equal(fs.existsSync(sourcePath(sourceFile.path)), true, `${sourceFile.key} source missing`);
  }
});

test('runtime dependency boundary blocks global runtime startup and migration commands', () => {
  for (const sourceFile of SOURCE_FILES) {
    assertForbiddenMarkersAbsent(sourceFile, [
      'process.env',
      'DATABASE_URL',
      'app.listen',
      'server.listen',
      'createServer',
      'node src/server.js',
      'npm run db:migrate',
      'psql',
      'db:migrate',
      'migration:run',
      'migrate:apply',
      'migrate:dry-run',
    ]);
  }
});

test('runtime dependency boundary blocks direct DB bootstrap and provider sending paths', () => {
  for (const sourceFile of SOURCE_FILES) {
    assertForbiddenMarkersAbsent(sourceFile, [
      "require('../db')",
      "require('../database')",
      "require('../repositories')",
      "require('../providers')",
      'from "../db"',
      "from '../db'",
      'new Pool',
      'Pool(',
      'pg.Pool',
      'createConnection',
      'knex(',
      'sequelize',
      'mongoose',
      'provider.send',
      'sendSms',
      'sendLine',
      'sendEmail',
      'webhook',
    ]);

    const source = readSource(sourceFile);
    assert.doesNotMatch(source, /\bconnect\s*\(/, `${sourceFile.key} must not create DB connections`);
  }
});

test('runtime dependency boundary blocks field service report write authority', () => {
  for (const sourceFile of SOURCE_FILES) {
    assertForbiddenMarkersAbsent(sourceFile, [
      'field_service_reports',
      'INSERT INTO field_service_reports',
      'UPDATE field_service_reports',
      'DELETE FROM field_service_reports',
    ]);
  }
});

test('finalAppointmentId remains a deny-list marker only', () => {
  for (const sourceFile of SOURCE_FILES) {
    const source = readSource(sourceFile);

    if (!source.includes('finalAppointmentId')) {
      continue;
    }

    assert.match(
      source,
      /const FORBIDDEN_INPUT_FIELDS = new Set\(\[[\s\S]*'finalAppointmentId'[\s\S]*\]\);/,
      `${sourceFile.key} finalAppointmentId must stay inside FORBIDDEN_INPUT_FIELDS`,
    );

    const sourceWithoutDenyList = stripForbiddenInputDenyList(source);
    assert.equal(
      sourceWithoutDenyList.includes('finalAppointmentId'),
      false,
      `${sourceFile.key} must not use finalAppointmentId outside deny-list authority`,
    );
  }
});
