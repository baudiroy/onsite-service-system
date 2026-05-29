'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const RESOLVER_FILE = 'src/customerAccess/customerIdentityLinkResolver.js';
const UNIT_TEST_FILE = 'tests/customerAccess/customerIdentityLinkResolver.unit.test.js';
const TASK_DOC = 'docs/task-1882-customer-identity-link-resolver-line-not-global-identity.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

test('Task1882 source test and doc files exist', () => {
  assert.equal(exists(RESOLVER_FILE), true);
  assert.equal(exists(UNIT_TEST_FILE), true);
  assert.equal(exists(TASK_DOC), true);
});

test('identity link resolver has no DB provider AI billing or runtime side-effect imports', () => {
  const source = read(RESOLVER_FILE);

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
  assert.doesNotMatch(source, /app\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)/i);
  assert.doesNotMatch(source, /psql|npm run db|migration|provider sending|send(Line|Sms|SMS|Email|Webhook)|OpenAI|RAG|billing/i);
});

test('identity link resolver output intentionally omits raw provider identifiers and secrets', () => {
  const source = read(RESOLVER_FILE);

  assert.match(source, /organizationId/);
  assert.match(source, /customerId/);
  assert.match(source, /contactId/);
  assert.match(source, /provider/);
  assert.match(source, /channel/);
  assert.doesNotMatch(source, /resolveAllow\([^)]*lineUserId/s);
  assert.doesNotMatch(source, /resolveAllow\([^)]*rawPhone/s);
  assert.doesNotMatch(source, /resolveAllow\([^)]*rawAddress/s);
  assert.doesNotMatch(source, /resolveAllow\([^)]*token/s);
  assert.doesNotMatch(source, /resolveAllow\([^)]*providerPayload/s);
});

test('unit coverage locks LINE not global identity and fail-closed link states', () => {
  const source = read(UNIT_TEST_FILE);

  assert.match(source, /allowed synthetic linked LINE identity/);
  assert.match(source, /missing identity link fails closed/);
  assert.match(source, /ambiguous identity links fail closed/);
  assert.match(source, /revoked disabled or inactive links fail closed/);
  assert.match(source, /LINE user id is not a global identity/);
  assert.match(source, /unsupported provider or channel fails closed/);
});
