'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const engineerMobileSourceDir = path.join(repoRoot, 'src/engineerMobile');

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
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

function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listSourceFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
    });
}

test('closure documentation summarizes Task720 through Task726 accepted read-model boundaries', () => {
  const source = readFile('docs/task-729-engineer-mobile-read-model-branch-closure-guard-no-runtime.md');

  assertContainsAll(
    source,
    [
      /Task720/,
      /Task721/,
      /Task722/,
      /Task723/,
      /Task724/,
      /Task725/,
      /Task726/,
      /sanitized fixtures/,
      /mapper redaction/,
      /injected provider/,
      /list \/ detail safety/,
      /no action intent/,
      /no completion writes/,
      /no DB/,
    ],
    'Task729 closure doc',
  );
});

test('Engineer Mobile Workbench design records the Task720-729 read-model branch closure', () => {
  const source = readFile('docs/design/engineer-mobile-workbench.md');

  assertContainsAll(
    source,
    [
      /Task720-729 Read-model Branch Closure/,
      /read-model only/,
      /no DB/,
      /no completion writes/,
      /no action intent/,
      /`finalAppointmentId` remains backend\/system-owned/,
    ],
    'Engineer Mobile Workbench design',
  );
});

test('Task720 through Task726 evidence files exist before branch closure', () => {
  for (const relativePath of [
    'docs/task-720-engineer-mobile-read-model-sanitized-fixture-contract-no-runtime.md',
    'docs/task-721-engineer-mobile-read-model-fixture-mapper-consumption-unit-test-no-db.md',
    'docs/task-722-engineer-mobile-read-model-fixture-negative-boundary-unit-test-no-db.md',
    'docs/task-723-engineer-mobile-app-factory-injected-read-model-provider-boundary-no-db.md',
    'docs/task-724-engineer-mobile-injected-read-model-provider-redaction-contract-no-db.md',
    'docs/task-725-engineer-mobile-injected-detail-provider-redaction-boundary-no-db.md',
    'docs/task-726-engineer-mobile-action-intent-boundary-no-completion-write-no-db.md',
  ]) {
    assert.equal(fileExists(relativePath), true, `${relativePath} should exist`);
  }
});

test('existing Engineer Mobile tests cover sanitized fixtures mapper redaction injected providers and action boundaries', () => {
  const combined = [
    'tests/engineerMobile/engineerMobileReadModelFixtureContract.static.test.js',
    'tests/engineerMobile/engineerMobileReadModelFixtureMapper.unit.test.js',
    'tests/engineerMobile/engineerMobileReadModelFixtureNegativeBoundary.unit.test.js',
    'tests/engineerMobile/engineerMobileInjectedReadModelProviderRedaction.unit.test.js',
    'tests/engineerMobile/engineerMobileInjectedDetailProviderRedaction.unit.test.js',
    'tests/engineerMobile/engineerMobileActionIntentBoundary.unit.test.js',
  ].map(readFile).join('\n');

  assertContainsAll(
    combined,
    [
      /DB URL|DB_URL|postgres/i,
      /token/i,
      /secret/i,
      /raw LINE|raw_line|line_user_id/i,
      /full phone|customerPhone|customer_phone/i,
      /full address|address/i,
      /internal note|internal_note/i,
      /audit raw|audit/i,
      /AI raw|ai raw|ai_raw/i,
      /billing|settlement/i,
      /finalAppointmentId|final_appointment_id/i,
      /fieldServiceReportId|field_service_report/i,
      /submitCompletion/,
      /createReport/,
      /updateReport/,
      /approveReport/,
      /publishReport/,
      /mutateFinalAppointmentId/,
      /sendProviderMessage/,
      /dispatchPush/,
      /writeCorrection/,
      /brandChannelWebhook/,
    ],
    'Existing Engineer Mobile boundary tests',
  );
});

test('Engineer Mobile source remains read-model only and imports no write DB provider or AI modules', () => {
  const sourceFiles = listSourceFiles(engineerMobileSourceDir);
  const task1762AllowedDbAdapterImport = './engineerMobileAssignedAppointmentDbRepository';

  assert.ok(sourceFiles.length > 0, 'expected Engineer Mobile source files');

  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const specifiers = requireSpecifiers(source);

    assert.equal(
      specifiers.some((specifier) => (
        specifier !== task1762AllowedDbAdapterImport
        && /FieldServiceReport|Completion|repositories?|db|pool|transaction|migration|provider.*send|notification|line|sms|email|push|openai|rag|vector|admin|smoke/i.test(specifier)
      )),
      false,
      `forbidden import in ${path.relative(repoRoot, file)}`,
    );
  }
});

test('closure doc preserves case report and final appointment invariants', () => {
  const source = readFile('docs/task-729-engineer-mobile-read-model-branch-closure-guard-no-runtime.md');

  assertContainsAll(
    source,
    [
      /One Case = one formal completion report/,
      /Multiple appointments are allowed/,
      /do not imply multiple formal reports/,
      /`finalAppointmentId` remains backend\/system-owned/,
      /not exposed or decided by Engineer Mobile read-model mapping/,
    ],
    'Task729 invariants',
  );
});
