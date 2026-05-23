'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const selfFile = path.relative(repoRoot, __filename);

const FIXED_SOURCE_FILES = [
  'src/server.js',
  'src/app.js',
  'src/routes/index.js',
  'src/routes/customerAccessRoutes.js',
  'src/controllers/customerAccessController.js',
];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readSource(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function listFilesRecursive(relativeDir, predicate = () => true) {
  const root = absolutePath(relativeDir);
  const results = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    const relativePath = path.relative(repoRoot, fullPath);

    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(relativePath, predicate));
      continue;
    }

    if (entry.isFile() && predicate(relativePath)) {
      results.push(relativePath);
    }
  }

  return results.sort();
}

function sourceFiles() {
  return [
    ...FIXED_SOURCE_FILES,
    ...listFilesRecursive('src/customerAccess', (relativePath) => relativePath.endsWith('.js')),
  ].sort();
}

function customerAccessTestFiles() {
  return listFilesRecursive('tests/customerAccess', (relativePath) => (
    relativePath.endsWith('.js') && relativePath !== selfFile
  ));
}

function taskDocs() {
  return listFilesRecursive('docs', (relativePath) => (
    /^docs\/task-64\d.*\.md$/.test(relativePath)
  ));
}

function lineWithNumber(source) {
  return source.split('\n').map((line, index) => ({
    line,
    lineNumber: index + 1,
  }));
}

function lineContextHasSyntheticPhoneMarker(lines, index) {
  const context = lines
    .slice(Math.max(0, index - 3), Math.min(lines.length, index + 4))
    .join('\n');

  return hasSyntheticPhoneMarker(context);
}

function assertNoLineMatch(relativePath, pattern, message) {
  for (const { line, lineNumber } of lineWithNumber(readSource(relativePath))) {
    assert.equal(
      pattern.test(line),
      false,
      `${relativePath}:${lineNumber} ${message}`
    );
  }
}

function hasSyntheticMarker(line) {
  return /should_not_leak|must-not-leak|synthetic|sentinel|db-url-should-not-leak/i.test(line);
}

function hasSyntheticPhoneMarker(line) {
  return /forbiddenValues|customerVisibleData|serviceReport\.phone|rawPhone|raw phone|phone-like|should_not_leak|should-not-leak|must-not-leak|synthetic|sentinel|serialized\.includes/i.test(line);
}

function isKnownSyntheticPhone(value) {
  return value === '0912-345-678';
}

test('secret logging boundary scans source, customer access tests, and task docs', () => {
  assert.equal(sourceFiles().length > FIXED_SOURCE_FILES.length, true);
  assert.equal(customerAccessTestFiles().length > 0, true);
  assert.equal(taskDocs().length > 0, true);
});

test('source files do not log process.env or sensitive env-like values', () => {
  for (const relativePath of sourceFiles()) {
    assertNoLineMatch(
      relativePath,
      /\b(console|logger)\.(log|info|warn|error)\([^)]*process\.env/i,
      'logs process.env'
    );
    assertNoLineMatch(
      relativePath,
      /\b(console|logger)\.(log|info|warn|error)\([^)]*(DATABASE_URL|DB_URL|POSTGRES_URL|TOKEN|SECRET|PASSWORD|LINE_ACCESS_TOKEN|LINE_CHANNEL_SECRET|connectionString)/i,
      'logs secret-like value'
    );
  }
});

test('customer access source does not log SQL text, params, or raw identifiers', () => {
  for (const relativePath of sourceFiles()) {
    assertNoLineMatch(
      relativePath,
      /\b(console|logger)\.(log|info|warn|error)\([^)]*(\bsql\b|\bparams\b|rawPhone|rawAddress|rawLineUserId|raw_phone|raw_address|line_user_id)/i,
      'logs SQL, params, or raw identifier'
    );
  }
});

test('source does not serialize whole process env, request, response, config, dbClient, or pool to logs', () => {
  for (const relativePath of sourceFiles()) {
    assertNoLineMatch(
      relativePath,
      /\b(console|logger)\.(log|info|warn|error)\([^)]*JSON\.stringify\((process\.env|req|request|res|response|env|config|dbClient|pool)/i,
      'logs serialized broad runtime object'
    );
  }
});

test('customer access source does not echo raw error messages into response bodies', () => {
  for (const relativePath of sourceFiles()) {
    if (relativePath === 'src/server.js') {
      continue;
    }

    assertNoLineMatch(
      relativePath,
      /(json|send|body|response|messageKey|message)\s*[:(][^\\n]*error\.message/i,
      'echoes raw error message toward response'
    );
  }
});

test('customer access source does not use interpolated SQL template literals', () => {
  for (const relativePath of sourceFiles()) {
    const source = readSource(relativePath);

    assert.doesNotMatch(
      source,
      /`[^`]*(select|insert|update|delete|from|where)[^`]*\$\{/i,
      `${relativePath} has interpolated SQL template`
    );
  }
});

test('tests and task docs do not contain real-looking credentials or customer PII', () => {
  for (const relativePath of [...customerAccessTestFiles(), ...taskDocs()]) {
    const source = readSource(relativePath);
    const lines = source.split('\n');

    assert.doesNotMatch(source, /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/, `${relativePath} contains OpenAI-like key`);
    assert.doesNotMatch(source, /xox[baprs]-[A-Za-z0-9-]{20,}/i, `${relativePath} contains Slack-like token`);
    assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, `${relativePath} contains JWT-like token`);
    assert.doesNotMatch(source, /\bU[a-f0-9]{32}\b/i, `${relativePath} contains LINE-user-id-like value`);

    for (const { line, lineNumber } of lineWithNumber(source)) {
      const phoneMatches = [...line.matchAll(/\b09\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/g)];

      if (phoneMatches.length === 0) {
        continue;
      }

      for (const match of phoneMatches) {
        assert.equal(
          isKnownSyntheticPhone(match[0]) || lineContextHasSyntheticPhoneMarker(lines, lineNumber - 1),
          true,
          `${relativePath}:${lineNumber} contains non-synthetic phone-like value`
        );
      }
    }
  }
});

test('postgres-like URLs in tests and docs are synthetic sentinel values only', () => {
  for (const relativePath of [...customerAccessTestFiles(), ...taskDocs()]) {
    for (const { line, lineNumber } of lineWithNumber(readSource(relativePath))) {
      if (!line.includes('postgres://')) {
        continue;
      }

      assert.equal(
        hasSyntheticMarker(line),
        true,
        `${relativePath}:${lineNumber} contains non-synthetic postgres URL`
      );
    }
  }
});

test('sentinel secrets only appear in tests or task docs, not runtime source', () => {
  for (const relativePath of sourceFiles()) {
    const source = readSource(relativePath);

    assert.doesNotMatch(source, /should_not_leak|must-not-leak/i, `${relativePath} contains test sentinel`);
  }
});

test('customer access source does not write raw payload files', () => {
  for (const relativePath of sourceFiles()) {
    const source = readSource(relativePath);

    assert.doesNotMatch(source, /fs\.writeFile|fs\.writeFileSync|createWriteStream/i, `${relativePath} writes raw files`);
  }
});

test('static boundary test itself does not include real secrets', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.equal(source.includes(['process', 'env'].join('.') + '.DATABASE_URL'), false);
  assert.equal(source.includes(['npm', 'run', 'db:migrate'].join(' ')), false);
  assert.equal(source.includes(['p', 's', 'q', 'l'].join('')), false);
  assert.equal(source.includes(['line', 'channel', 'secret'].join('_')), false);
  assert.equal(source.includes(['access', 'token'].join('_')), false);
});
