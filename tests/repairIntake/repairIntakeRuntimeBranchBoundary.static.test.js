'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const REPAIR_INTAKE_SOURCE_DIR = path.join(repoRoot, 'src/repairIntake');
const REPAIR_INTAKE_ROUTE_PATH = path.join(repoRoot, 'src/routes/repairIntakeDraftToCase.routes.js');
const OPEN_REPAIR_INTAKE_SOURCE_DIR = path.join(repoRoot, 'src/openRepairIntake');
const OPEN_REPAIR_INTAKE_TEST_DIR = path.join(repoRoot, 'tests/openRepairIntake');
const PUBLIC_RESULT_PRESENTER_PATH = path.join(
  repoRoot,
  'src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js',
);

function readSource(sourcePath) {
  return fs.readFileSync(sourcePath, 'utf8');
}

function repairIntakeSourceFiles() {
  return fs.readdirSync(REPAIR_INTAKE_SOURCE_DIR)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => path.join(REPAIR_INTAKE_SOURCE_DIR, fileName))
    .sort();
}

function stripConstCollection(source, constName) {
  return source
    .replace(new RegExp(`const ${constName} = new Set\\(\\[[\\s\\S]*?\\]\\);`, 'g'), '')
    .replace(new RegExp(`const ${constName} = Object\\.freeze\\(\\[[\\s\\S]*?\\]\\);`, 'g'), '')
    .replace(new RegExp(`const ${constName} = \\[[\\s\\S]*?\\];`, 'g'), '')
    .replace(new RegExp(`const ${constName} = \\{[\\s\\S]*?\\};`, 'g'), '');
}

function sourceWithoutGuardLists(source) {
  return [
    'FORBIDDEN_INPUT_FIELDS',
    'SAFE_FIELD_NAMES',
    'UNSAFE_FIELD_NAMES',
    'UNSAFE_INPUT_FIELDS',
    'UNSAFE_OUTPUT_FIELDS',
    'UNSAFE_REQUEST_FIELD_NAMES',
    'UNSAFE_OUTPUT_FIELD_NAMES',
    'UNSAFE_TEXT_PATTERNS',
    'FORBIDDEN_MARKERS',
    'FORBIDDEN_IMPORT_MARKERS',
    'HARD_FORBIDDEN_RUNTIME_MARKERS',
    'PRIVATE_FIELD_NAMES',
  ].reduce((current, constName) => stripConstCollection(current, constName), source);
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(['"]([^'"]+)['"]\)/g), (match) => match[1]);
}

test('Task2187 Repair Intake re-entry surface is present and Open Repair Intake has no active module yet', () => {
  assert.equal(fs.existsSync(REPAIR_INTAKE_SOURCE_DIR), true, 'src/repairIntake should exist');
  assert.equal(fs.existsSync(REPAIR_INTAKE_ROUTE_PATH), true, 'Repair Intake route file should exist');
  assert.equal(repairIntakeSourceFiles().length > 0, true, 'Repair Intake source files should be present');
  assert.equal(fs.existsSync(OPEN_REPAIR_INTAKE_SOURCE_DIR), false, 'Open Repair Intake source dir is not active yet');
  assert.equal(fs.existsSync(OPEN_REPAIR_INTAKE_TEST_DIR), false, 'Open Repair Intake test dir is not active yet');
});

test('Repair Intake runtime branch does not import app server public route globals or provider modules directly', () => {
  for (const sourcePath of [...repairIntakeSourceFiles(), REPAIR_INTAKE_ROUTE_PATH]) {
    const source = readSource(sourcePath);
    const specifiers = requireSpecifiers(source);

    for (const forbiddenSpecifier of [
      '../app',
      '../server',
      '../routes',
      '../routes/index',
      '../routes/public.routes',
      '../controllers',
      '../providers',
      '../admin',
      './app',
      './server',
      './routes',
      './controllers',
      'pg',
      'openai',
    ]) {
      assert.equal(
        specifiers.includes(forbiddenSpecifier),
        false,
        `${path.relative(repoRoot, sourcePath)} imported forbidden module ${forbiddenSpecifier}`,
      );
    }
  }
});

test('Repair Intake runtime branch avoids env, listener, migration, provider, AI, and billing execution markers', () => {
  for (const sourcePath of [...repairIntakeSourceFiles(), REPAIR_INTAKE_ROUTE_PATH]) {
    const source = sourceWithoutGuardLists(readSource(sourcePath));
    const relativePath = path.relative(repoRoot, sourcePath);

    for (const forbidden of [
      /process\.env/,
      /DATABASE_URL/,
      /\bnew\s+Pool\b/,
      /\bcreatePool\b/,
      /\brequire\(['"]pg['"]\)/,
      /\bapp\.listen\s*\(/,
      /\bserver\.listen\s*\(/,
      /\bcreateServer\s*\(/,
      /\bpsql\b/i,
      /\bmigrate\b/i,
      /\bmigration\b/i,
      /\blineClient\b|\bsmsClient\b|\bemailClient\b|\bwebhookClient\b/i,
      /\bsendLine\b|\bsendSms\b|\bsendEmail\b|\bpushMessage\b/i,
      /\bopenai\b|\brag\b|\bvector\b|\bmodelProvider\b/i,
      /\bbillingProvider\b|\bbillingClient\b|\bpayment\b|\binvoice\b|\bsettlement\b/i,
    ]) {
      assert.doesNotMatch(source, forbidden, `${relativePath} matched forbidden marker ${forbidden}`);
    }
  }
});

test('Repair Intake public result presenter remains explicit allowlist and does not expose raw identity fields', () => {
  const source = readSource(PUBLIC_RESULT_PRESENTER_PATH);

  for (const requiredMarker of [
    'caseId',
    'repairIntakeDraftId',
    'messageKey',
    'reasonCode',
    'presentRepairIntakeDraftToCaseResult',
  ]) {
    assert.match(source, new RegExp(requiredMarker), `missing public allowlist marker ${requiredMarker}`);
  }

  for (const forbidden of [
    /\bphone\b/i,
    /\baddress\b/i,
    /\bemail\b/i,
    /\blineUserId\b/i,
    /\blineAccessToken\b/i,
    /\braw\b/i,
    /\bprivateNotes\b/i,
    /\bproviderPayload\b/i,
    /\bsql\b/i,
    /\btoken\b/i,
  ]) {
    assert.doesNotMatch(source, forbidden, `public presenter exposes forbidden marker ${forbidden}`);
  }
});
