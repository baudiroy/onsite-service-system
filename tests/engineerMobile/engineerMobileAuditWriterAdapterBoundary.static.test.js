'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const adapterPath = 'src/engineerMobile/engineerMobileAuditWriterAdapter.js';
const runtimeFiles = [
  'src/routes/engineerMobileRoutes.js',
  'src/routes/engineerMobileTaskDetailRoutes.js',
  'src/routes/engineerMobileVisitActionRoutes.js',
  'src/controllers/engineerMobileController.js',
  'src/controllers/engineerMobileTaskDetailController.js',
  'src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js',
  'src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js',
  'src/app.js',
  'src/server.js',
  'src/routes/index.js',
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
}

test('Task2170 adapter source file exists', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, adapterPath)), true);
});

test('adapter imports only Task2167 builder constants and Task2169 normalizer', () => {
  const source = read(adapterPath);

  assert.deepEqual(requireSpecifiers(source), [
    './engineerMobileAuditEventBuilder',
    './engineerMobileAuditWriterResultNormalizer',
  ]);
  assert.doesNotMatch(source, /customerAccess|CustomerAccess/);
});

test('adapter source has no env IO network listener DB provider AI billing side effects', () => {
  const source = read(adapterPath);

  assert.doesNotMatch(source, /Date\.now\s*\(|new\s+Date\s*\(/);
  assert.doesNotMatch(source, /Math\.random\s*\(|crypto|getRandomValues|randomUUID/i);
  assert.doesNotMatch(source, /process\.env|globalThis|global\./);
  assert.doesNotMatch(source, /fs\.|readFile|writeFile|openSync|createWriteStream|createReadStream/);
  assert.doesNotMatch(source, /fetch\s*\(|axios|http\.request|https\.request|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(source, /listen\s*\(|server\.listen|app\.listen|http\.createServer/);
  assert.doesNotMatch(source, /\.query\s*\(|connect\s*\(|Pool\s*\(|Client\s*\(|pg\b|knex|sequelize|prisma|mysql|sqlite|psql/i);
  assert.doesNotMatch(source, /migration|ALTER\s+TABLE|CREATE\s+TABLE|DROP\s+TABLE|INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM/i);
  assert.doesNotMatch(source, /\.(send|push|publish|notify|enqueue)\s*\(|line|sms|email|webhook|app push/i);
  assert.doesNotMatch(source, /OpenAI|RAG|modelProvider|billingProvider|paymentProvider|settlementProvider|invoiceProvider/i);
});

test('adapter is not imported by Engineer Mobile runtime routes controllers app or server', () => {
  for (const file of runtimeFiles) {
    const source = read(file);
    const specifiers = requireSpecifiers(source);

    assert.equal(
      specifiers.some((specifier) => specifier.includes('engineerMobileAuditWriterAdapter')),
      false,
      `${file} must not import Task2170 adapter`,
    );
    assert.equal(
      source.includes('writeEngineerMobileAuditEvent'),
      false,
      `${file} must not call Task2170 adapter`,
    );
  }
});

test('adapter source avoids raw sensitive output keys', () => {
  const source = read(adapterPath);

  for (const pattern of [
    /rawWriterResult/,
    /error\s*:/,
    /message\s*:/,
    /stack\s*:/,
    /cause\s*:/,
    /dbRows/,
    /queryMetadata/,
    /sql\s*:/,
    /headers\s*:/,
    /authorization\s*:/,
    /cookies\s*:/,
    /token\s*:/,
    /rawRequest/,
    /rawResponse/,
    /rawUser/,
    /rawSession/,
    /customerPhone/,
    /providerPayload/,
    /pushPayload/,
    /aiPrompt/,
    /env\s*:/,
    /billing\s*:/,
    /privateNote/,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});
