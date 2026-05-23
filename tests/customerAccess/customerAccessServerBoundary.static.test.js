'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_FILES = [
  'src/server.js',
  'src/app.js',
  'src/routes/index.js',
  'src/routes/customerAccessRoutes.js',
  'src/customerAccess/customerAccessEnvBoundary.js',
  'src/customerAccess/customerAccessBootstrapComposer.js',
  'src/customerAccess/customerAccessDbClientFactory.js',
  'src/customerAccess/customerAccessReadOnlyDbConnector.js',
  'src/customerAccess/customerAccessDbAdapter.js',
  'src/customerAccess/customerAccessDbQueryExecutor.js',
  'src/customerAccess/customerAccessReadOnlyRepository.js',
  'src/customerAccess/customerAccessDbReadModelMapper.js',
  'src/customerAccess/customerAccessContextMiddleware.js',
  'src/customerAccess/customerAccessContextProvider.js',
  'src/controllers/customerAccessController.js',
];

const CUSTOMER_ACCESS_CHAIN_FILES = SOURCE_FILES.filter((filePath) => (
  filePath.includes('/customerAccess/')
  || filePath === 'src/routes/customerAccessRoutes.js'
  || filePath === 'src/controllers/customerAccessController.js'
));

const DB_BOUNDED_FILES = new Set([
  'src/customerAccess/customerAccessDbQueryExecutor.js',
  'src/customerAccess/customerAccessDbClientFactory.js',
  'src/customerAccess/customerAccessReadOnlyDbConnector.js',
  'src/customerAccess/customerAccessDbAdapter.js',
  'src/customerAccess/customerAccessDbReadModelMapper.js',
]);

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readSource(relativePath) {
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

function importLines(source) {
  return source
    .split('\n')
    .filter((line) => line.includes('require(') || line.trim().startsWith('import '));
}

function assertNoSensitiveLogging(relativePath, source) {
  assert.doesNotMatch(
    source,
    /console\.(log|warn|error|info)\([^)]*process\.env/i,
    `${relativePath} logs process.env`
  );
  assert.doesNotMatch(
    source,
    /(console|logger)\.(log|warn|error|info)\([^)]*(DATABASE_URL|TOKEN|SECRET|PASSWORD|LINE_CHANNEL_SECRET|LINE_CHANNEL_ACCESS_TOKEN)/i,
    `${relativePath} logs sensitive env-like values`
  );
}

test('all Customer Access server boundary source files exist', () => {
  for (const relativePath of SOURCE_FILES) {
    assert.equal(fs.existsSync(absolutePath(relativePath)), true, `${relativePath} missing`);
  }
});

test('src/server.js does not directly import customer access DB runtime internals', () => {
  const source = readSource('src/server.js');
  const specifiers = requireSpecifiers(source);

  for (const forbiddenSpecifier of [
    './customerAccess/customerAccessDbAdapter',
    './customerAccess/customerAccessDbQueryExecutor',
    './customerAccess/customerAccessReadOnlyRepository',
    './customerAccess/customerAccessReadOnlyDbConnector',
  ]) {
    assert.equal(specifiers.includes(forbiddenSpecifier), false, `server imports ${forbiddenSpecifier}`);
  }
});

test('src/server.js does not directly read process.env for customer access enablement', () => {
  const source = readSource('src/server.js');

  assert.doesNotMatch(
    source,
    /process\.env\.(CUSTOMER_ACCESS|DATABASE_URL|TOKEN|SECRET|PASSWORD|LINE_CHANNEL)/i
  );
});

test('server and app do not directly import real DB singleton, transaction, repository, provider, or AI modules', () => {
  for (const relativePath of ['src/server.js', 'src/app.js']) {
    const specifiers = requireSpecifiers(readSource(relativePath));

    assert.equal(
      specifiers.some((specifier) => /(^|\/)(db|pool|repositories?|transaction|provider|line|sms|email|push|ai|rag|vector|openai)(\.|\/|$)/i.test(specifier)),
      false,
      `${relativePath} has forbidden direct import`
    );
  }
});

test('route index customer-access imports stay limited to customer access route registry', () => {
  const source = readSource('src/routes/index.js');
  const specifiers = requireSpecifiers(source).filter((specifier) => specifier.toLowerCase().includes('customeraccess'));

  assert.deepEqual(specifiers.sort(), [
    '../customerAccess/customerAccessRouteRegistry',
    './customerAccessRoutes',
  ].sort());
});

test('customer access chain does not import external provider, AI, RAG, vector, OpenAI, or messaging modules', () => {
  for (const relativePath of CUSTOMER_ACCESS_CHAIN_FILES) {
    const specifiers = requireSpecifiers(readSource(relativePath));

    assert.equal(
      specifiers.some((specifier) => /(line|sms|email|push|ai|rag|vector|openai)/i.test(specifier)),
      false,
      `${relativePath} imports forbidden provider or AI dependency`
    );
  }
});

test('customer access chain does not import existing domain repositories', () => {
  for (const relativePath of CUSTOMER_ACCESS_CHAIN_FILES) {
    const specifiers = requireSpecifiers(readSource(relativePath));

    assert.equal(
      specifiers.some((specifier) => /repositories\//i.test(specifier)),
      false,
      `${relativePath} imports existing domain repository`
    );
  }
});

test('no customer access boundary source logs process.env or sensitive env-like values', () => {
  for (const relativePath of SOURCE_FILES) {
    assertNoSensitiveLogging(relativePath, readSource(relativePath));
  }
});

test('app.listen only appears in src/server.js guarded server source', () => {
  for (const relativePath of SOURCE_FILES) {
    const source = readSource(relativePath);
    const hasListenCall = /\.listen\s*\(/.test(source);

    if (relativePath === 'src/server.js') {
      assert.equal(hasListenCall, true, 'server should own listen call');
      assert.match(source, /require\.main\s*===\s*module/);
      continue;
    }

    assert.equal(hasListenCall, false, `${relativePath} contains listen call`);
  }
});

test('customer access boundary source does not write files or streams', () => {
  for (const relativePath of SOURCE_FILES) {
    const source = readSource(relativePath);

    assert.doesNotMatch(source, /fs\.writeFile|fs\.writeFileSync|createWriteStream/i, `${relativePath} writes files`);
  }
});

test('DB-like runtime keywords stay inside bounded customer access DB files', () => {
  for (const relativePath of SOURCE_FILES) {
    if (DB_BOUNDED_FILES.has(relativePath)) {
      continue;
    }

    const lines = importLines(readSource(relativePath)).join('\n');

    assert.doesNotMatch(
      lines,
      /pg|new Pool|transaction|begin|commit|rollback/i,
      `${relativePath} imports or declares DB runtime keyword outside bounded DB files`
    );
  }
});

test('bounded customer access DB files still do not import singleton DB or transaction helpers', () => {
  for (const relativePath of DB_BOUNDED_FILES) {
    const source = readSource(relativePath);
    const specifiers = requireSpecifiers(source);

    assert.equal(
      specifiers.some((specifier) => /(^|\/)(db|pool|transaction)(\.|\/|$)/i.test(specifier)),
      false,
      `${relativePath} imports singleton DB or transaction helper`
    );
  }
});

test('static boundary test uses only synthetic scans and no real secrets', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.equal(source.includes(['process', 'env'].join('.') + '.DATABASE_URL'), false);
  assert.equal(source.includes(['npm', 'run', 'db:migrate'].join(' ')), false);
  assert.equal(source.includes(['p', 's', 'q', 'l'].join('')), false);
  assert.equal(source.includes(['line', 'channel', 'secret'].join('_')), false);
  assert.equal(source.includes(['access', 'token'].join('_')), false);
});
