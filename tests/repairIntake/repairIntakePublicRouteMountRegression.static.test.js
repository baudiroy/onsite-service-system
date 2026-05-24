'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(__dirname, '../../src/routes/public.routes.js');

function readSource() {
  return fs.readFileSync(SOURCE_PATH, 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

test('Task1110 public route source exists', () => {
  assert.equal(fs.existsSync(SOURCE_PATH), true);
});

test('public routes keep wrapper-only Repair Intake import', () => {
  const source = readSource();
  const repairIntakeSpecifiers = requireSpecifiers(source).filter((specifier) => (
    specifier.includes('../repairIntake/')
  ));

  assert.deepEqual(repairIntakeSpecifiers, [
    '../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
  assert.match(source, /createRepairIntakeDraftToCaseInjectedRouteComposition/);

  [
    'repairIntakeDraftToCaseInjectedRuntimeComposer',
    'repairIntakeDraftToCaseHttpMountAdapter',
    'repairIntakeDraftToCaseController',
    'repairIntakeDraftToCaseApiModule',
    'repairIntakeDraftReaderPortAdapter',
    'repairIntakeCasePlannerPortAdapter',
    'repairIntakeCaseCreatorPortAdapter',
    'repairIntakeAuditWriterPortAdapter',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `forbidden lower-level Repair Intake marker ${marker}`);
  });
});

test('public routes keep plain Express Router mountTarget adapter and block direct router target', () => {
  const source = readSource();

  assert.match(source, /mountTarget: \{[\s\S]*?post: router\.post\.bind\(router\)[\s\S]*?\}/);
  assert.doesNotMatch(source, /mountTarget:\s*router[,}]/);
});

test('public routes keep explicit runtimePorts injection only', () => {
  const source = readSource();

  assert.match(source, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(source, /repairIntakeDraftToCase\.runtimePorts/);
  assert.match(source, /function getRepairIntakeDraftToCaseRuntimePorts\(options = {}\)/);
  assert.match(source, /if \(!runtimePorts\) \{[\s\S]*?return null;[\s\S]*?\}/);

  [
    'createRepairIntakeSyntheticAppCompositionHarness',
    'createSyntheticMountTarget',
    'defaultRepairIntake',
    'new DraftRepository',
    'new CaseRepository',
    'new IdempotencyRepository',
    'new AuditRepository',
    'process.env.REPAIR_INTAKE',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `forbidden default port marker ${marker}`);
  });
});

test('public routes keep fail-safe basePath and avoid hard-coded final route suffixes', () => {
  const source = readSource();

  assert.match(source, /basePath: '\/repair-intake'/);
  assert.doesNotMatch(source, /router\.post\(\s*['"]\/repair-intake/);
  assert.doesNotMatch(source, /\/repair-intake\/drafts\/:draftId\/case\/plan/);
  assert.doesNotMatch(source, /\/repair-intake\/drafts\/:draftId\/case\/submit/);
});

test('public routes keep existing public route surface', () => {
  const source = readSource();

  [
    '/case-inquiry',
    '/line-case-inquiry',
    '/brand-referral/normalize',
    'createPublicRouter',
    'publicRouter',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), true, `missing existing public route marker ${marker}`);
  });
});

test('public route mount regression guard blocks forbidden coupling markers', () => {
  const source = readSource();

  [
    "require('../db')",
    "require('../repositories')",
    "require('../app')",
    "require('../server')",
    'src/db',
    'src/repositories',
    'src/app',
    'src/server',
    'app.listen',
    'server.listen',
    'listen(',
    'process.env',
    'DATABASE_URL',
    'psql',
    'db:migrate',
    'migration',
    'migrations',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openai',
    'vector',
    'rag',
    'openapi',
    'swagger',
    'admin/src',
    'billing',
    'settlement',
    'invoice',
    'payment',
    'package.json',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `forbidden public route source marker ${marker}`);
  });
});
