'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const RESOLVER_FILE = 'src/customerAccess/customerAccessRequestContextResolver.js';
const UNIT_TEST_FILE = 'tests/customerAccess/customerAccessRequestContextResolver.unit.test.js';
const TASK_DOC = 'docs/task-911-customer-access-request-context-resolver-synthetic-token-context-no-auth-runtime-no-route.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
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

test('Task911 source test and doc files exist', () => {
  for (const file of [RESOLVER_FILE, UNIT_TEST_FILE, TASK_DOC]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('resolver is pure and imports no DB repository auth JWT provider AI billing server env config network logger dependency', () => {
  const source = read(RESOLVER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
  assert.doesNotMatch(source, /require\(['"][^'"]*(db|pool|repositories?|transaction|auth|session|jwt|jose|passport|provider|line|sms|email|push|webhook|OpenAI|RAG|vector|search|billing|settlement|server|app|routes?|env|config|credential|logger|network)/i);
});

test('resolver does not implement auth runtime route rollout or mutation execution paths', () => {
  const source = read(RESOLVER_FILE);

  assert.doesNotMatch(source, /verify\w*Token|jwt\.verify|decode\w*Token|passport|sessionStore|set-cookie|login|logout/i);
  assert.doesNotMatch(source, /app\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)|register.*Route/i);
  assert.doesNotMatch(source, /\binsert\s*\(|\bupdate\s*\(|\bdelete\s*\(|\bcreate\s*\(|\bapprove\s*\(|\bpublish\s*\(/i);
});

test('resolver output is minimal and never copies raw request identity or sensitive fields', () => {
  const source = read(RESOLVER_FILE);

  assert.match(source, /customerAccessContext:\s*buildNormalizedContext/);
  assert.match(source, /customerAccessContext:\s*null/);
  assert.doesNotMatch(source, /customerAccessContext:\s*(context|request|sources?\[)/);
  assert.doesNotMatch(source, /headers|authorization|cookie|rawPhone|rawAddress|lineUserId|line_user_id|providerRawPayload|aiRawPayload|billingInternalData|password|apiKey/);
});

test('unit coverage locks fail-closed and valid synthetic context behavior', () => {
  const source = read(UNIT_TEST_FILE);

  assert.match(source, /missing request fails closed/);
  assert.match(source, /missing pre-resolved synthetic context fails closed/);
  assert.match(source, /missing organization or customer id fails closed/);
  assert.match(source, /invalid organization and customer id shapes fail closed/);
  assert.match(source, /unauthorized context fails closed/);
  assert.match(source, /malformed scoped case or report identifiers fail closed/);
  assert.match(source, /ambiguous identity sources fail closed/);
  assert.match(source, /raw bearer token header and cookie alone are not trusted/);
  assert.match(source, /LINE user id alone is not trusted/);
  assert.match(source, /valid customerAccessContext returns normalized minimal context/);
  assert.match(source, /nested forbidden sensitive fields are excluded/);
});

test('Task911 evidence doc records no auth runtime no route no migration and no provider AI billing scope', () => {
  const doc = read(TASK_DOC);

  assert.match(doc, /No auth runtime/);
  assert.match(doc, /No login\/session implementation/);
  assert.match(doc, /No JWT verification/);
  assert.match(doc, /No route/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
});
