'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const normalizerPath = 'src/engineerMobile/engineerMobileAuditWriterResultNormalizer.js';
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

test('Task2169 normalizer source file exists', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, normalizerPath)), true);
});

test('normalizer is dependency-free and imports no runtime or Customer Access modules', () => {
  const source = read(normalizerPath);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.doesNotMatch(source, /require\s*\(|import\s+/);
  assert.doesNotMatch(source, /customerAccess|CustomerAccess/);
});

test('normalizer source has no time randomness env IO network listener DB provider AI billing side effects', () => {
  const source = read(normalizerPath);

  assert.doesNotMatch(source, /Date\.now\s*\(|new\s+Date\s*\(/);
  assert.doesNotMatch(source, /Math\.random\s*\(|crypto|getRandomValues|randomUUID/i);
  assert.doesNotMatch(source, /process\.env|globalThis|global\./);
  assert.doesNotMatch(source, /fs\.|readFile|writeFile|openSync|createWriteStream|createReadStream/);
  assert.doesNotMatch(source, /fetch\s*\(|axios|http\.request|https\.request|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(source, /listen\s*\(|server\.listen|app\.listen|http\.createServer/);
  assert.doesNotMatch(source, /\.query\s*\(|connect\s*\(|Pool\s*\(|Client\s*\(|pg\b|knex|sequelize|prisma|mysql|sqlite|psql/i);
  assert.doesNotMatch(source, /migration|ALTER\s+TABLE|CREATE\s+TABLE|DROP\s+TABLE|INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM/i);
  assert.doesNotMatch(source, /\.(send|push|publish|notify|enqueue)\s*\(|line|sms|email|webhook|app push/i);
  assert.doesNotMatch(source, /OpenAI|RAG|model|billing|payment|settlement|invoice/i);
});

test('normalizer is not imported by Engineer Mobile runtime routes controllers app or server', () => {
  for (const file of runtimeFiles) {
    const source = read(file);
    const specifiers = requireSpecifiers(source);

    assert.equal(
      specifiers.some((specifier) => specifier.includes('engineerMobileAuditWriterResultNormalizer')),
      false,
      `${file} must not import Task2169 normalizer`,
    );
    assert.equal(
      source.includes('normalizeEngineerMobileAuditWriterResult'),
      false,
      `${file} must not call Task2169 normalizer`,
    );
  }
});

test('normalizer source emits only the allowed result keys', () => {
  const source = read(normalizerPath);
  const unsafeOutputPatterns = [
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
  ];

  assert.match(source, /ENGINEER_MOBILE_AUDIT_WRITER_RESULT_KEYS/);
  assert.match(source, /function normalizeEngineerMobileAuditWriterResult/);

  for (const pattern of unsafeOutputPatterns) {
    assert.doesNotMatch(source, pattern);
  }
});
