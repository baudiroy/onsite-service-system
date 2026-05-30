'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  builder: 'src/engineerMobile/engineerMobileAuditEventBuilder.js',
  routes: [
    'src/routes/engineerMobileRoutes.js',
    'src/routes/engineerMobileTaskDetailRoutes.js',
    'src/routes/engineerMobileVisitActionRoutes.js',
  ],
  controllers: [
    'src/controllers/engineerMobileController.js',
    'src/controllers/engineerMobileTaskDetailController.js',
  ],
  runtimeAdapters: [
    'src/engineerMobile/engineerMobileVisitActionHttpHandlerAdapter.js',
    'src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js',
    'src/app.js',
    'src/server.js',
    'src/routes/index.js',
  ],
});

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
}

test('Task2167 audit event builder source file exists', () => {
  assert.equal(fs.existsSync(absolutePath(FILES.builder)), true);
});

test('builder is dependency-free and imports no runtime modules', () => {
  const builder = read(FILES.builder);

  assert.deepEqual(requireSpecifiers(builder), []);
  assert.doesNotMatch(builder, /require\s*\(|import\s+/);
});

test('builder source has no time randomness env IO network listener DB provider AI billing side effects', () => {
  const builder = read(FILES.builder);

  assert.doesNotMatch(builder, /Date\.now\s*\(|new\s+Date\s*\(/);
  assert.doesNotMatch(builder, /Math\.random\s*\(|crypto|getRandomValues|randomUUID/i);
  assert.doesNotMatch(builder, /process\.env|globalThis|global\./);
  assert.doesNotMatch(builder, /fs\.|readFile|writeFile|openSync|createWriteStream|createReadStream/);
  assert.doesNotMatch(builder, /fetch\s*\(|axios|http\.request|https\.request|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(builder, /listen\s*\(|server\.listen|app\.listen|http\.createServer/);
  assert.doesNotMatch(builder, /\.query\s*\(|connect\s*\(|Pool\s*\(|Client\s*\(|pg\b|knex|sequelize|prisma|mysql|sqlite|psql/i);
  assert.doesNotMatch(builder, /migration|ALTER\s+TABLE|CREATE\s+TABLE|DROP\s+TABLE|INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM/i);
  assert.doesNotMatch(builder, /\.(send|push|publish|notify|enqueue)\s*\(|line|sms|email|webhook|app push/i);
  assert.doesNotMatch(builder, /OpenAI|RAG|model|billing|payment|settlement|invoice/i);
});

test('builder exposes only sanitized event builder API', () => {
  const builder = read(FILES.builder);

  assert.match(builder, /SUPPORTED_ENGINEER_MOBILE_AUDIT_EVENT_TYPES/);
  assert.match(builder, /ENGINEER_MOBILE_AUDIT_EVENT_KEYS/);
  assert.match(builder, /ENGINEER_MOBILE_AUDIT_METADATA_KEYS/);
  assert.match(builder, /function buildEngineerMobileAuditEvent/);
  assert.doesNotMatch(builder, /module\.exports\s*=\s*buildEngineerMobileAuditEvent/);
  assert.doesNotMatch(builder, /JSON\.stringify|res\.json|throw\s+new\s+Error|console\./);
});

test('builder is not imported by Engineer Mobile runtime routes controllers adapters app or server', () => {
  const checkedFiles = [
    ...FILES.routes,
    ...FILES.controllers,
    ...FILES.runtimeAdapters,
  ];

  for (const file of checkedFiles) {
    const source = read(file);
    const specifiers = requireSpecifiers(source);

    assert.equal(
      specifiers.some((specifier) => specifier.includes('engineerMobileAuditEventBuilder')),
      false,
      `${file} must not import Task2167 builder during no-runtime-integration task`,
    );
    assert.equal(
      source.includes('buildEngineerMobileAuditEvent'),
      false,
      `${file} must not call Task2167 builder during no-runtime-integration task`,
    );
  }
});

test('builder source does not name raw sensitive request response provider DB or AI fields as output keys', () => {
  const builder = read(FILES.builder);
  const unsafeOutputPatterns = [
    /rawRequest/,
    /rawResponse/,
    /rawHeaders/,
    /authorization\s*:/,
    /cookies\s*:/,
    /\bbody\b\s*:/,
    /\bquery\b\s*:/,
    /\bparams\b\s*:/,
    /rawUser/,
    /rawSession/,
    /rawAuth/,
    /customerPhone/,
    /customerAddress/,
    /customerEmail/,
    /lineUserId/,
    /rawEngineerContext/,
    /rawServiceResult/,
    /dbRows/,
    /queryMetadata/,
    /providerPayload/,
    /aiPrompt/,
    /\bstack\b\s*:/,
    /\bsql\b\s*:/,
    /privateNote/,
    /completionReportPrivateBody/,
  ];

  for (const pattern of unsafeOutputPatterns) {
    assert.doesNotMatch(builder, pattern);
  }
});
