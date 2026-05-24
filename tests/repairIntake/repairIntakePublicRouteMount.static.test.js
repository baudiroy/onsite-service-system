'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(__dirname, '../../src/routes/public.routes.js');
const PREFLIGHT_PATH = path.resolve(
  __dirname,
  './repairIntakeRouteMountTargetPreflight.static.test.js',
);

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

function repairIntakeSpecifiers(source) {
  return requireSpecifiers(source).filter((specifier) => specifier.includes('repairIntake'));
}

test('Task1108 public route mount source and preflight guard exist', () => {
  assert.equal(fs.existsSync(SOURCE_PATH), true);
  assert.equal(fs.existsSync(PREFLIGHT_PATH), true);
});

test('public routes import only the injected Repair Intake route-composition wrapper', () => {
  const source = readSource();

  assert.deepEqual(repairIntakeSpecifiers(source), [
    '../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
  assert.match(source, /createRepairIntakeDraftToCaseInjectedRouteComposition/);
  assert.doesNotMatch(source, /createRepairIntakeSyntheticAppCompositionHarness/);
});

test('default public router path remains safe without Repair Intake runtime ports', () => {
  const source = readSource();

  assert.match(source, /const publicRouter = createPublicRouter\(\);/);
  assert.match(source, /function getRepairIntakeDraftToCaseRuntimePorts\(options = {}\)/);
  assert.match(source, /if \(!runtimePorts\) \{[\s\S]*?return null;[\s\S]*?\}/);
});

test('Repair Intake public route mount is conditional on explicit injected runtime ports', () => {
  const source = readSource();

  assert.match(source, /options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(source, /options\.repairIntakeDraftToCase\.runtimePorts/);
  assert.match(source, /function mountRepairIntakeDraftToCaseRoutesIfConfigured\(router, options = {}\)/);
  assert.match(source, /runtimePorts,\s*[\r\n]\s*basePath: '\/repair-intake',\s*[\r\n]\s*mountTarget: \{/);
  assert.match(source, /post: router\.post\.bind\(router\)/);
  assert.match(source, /mountRepairIntakeDraftToCaseRoutesIfConfigured\(router, options\)/);
});

test('Repair Intake public route skeleton uses wrapper basePath and does not hard-code route suffixes', () => {
  const source = readSource();

  assert.match(source, /basePath: '\/repair-intake'/);
  assert.doesNotMatch(source, /\/repair-intake\/drafts\/:draftId\/case\/plan/);
  assert.doesNotMatch(source, /\/repair-intake\/drafts\/:draftId\/case\/submit/);
  assert.doesNotMatch(source, /router\.post\(\s*['"]\/repair-intake/);
});

test('public route source keeps existing public routes and exports', () => {
  const source = readSource();

  for (const marker of [
    '/case-inquiry',
    '/line-case-inquiry',
    '/brand-referral/normalize',
    'createPublicRouter',
    'publicRouter',
  ]) {
    assert.equal(source.includes(marker), true, `missing existing public route marker ${marker}`);
  }
});

test('public route skeleton has no DB repository app server provider AI billing or OpenAPI coupling', () => {
  const source = readSource();

  for (const forbidden of [
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
    'openapi',
    'swagger',
    'admin/src',
    'billing',
    'settlement',
    'invoice',
    'payment',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden public route marker ${forbidden}`);
  }
});
