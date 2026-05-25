'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
}

function assertFileExists(relativePath) {
  assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`);
}

test('Task735 through Task737 pure-policy evidence docs exist before closure', () => {
  [
    'docs/task-735-brand-referral-source-recognition-policy-baseline-no-api-no-db.md',
    'docs/task-736-brand-channel-triage-policy-baseline-no-ai-no-db.md',
    'docs/task-737-brand-referral-triage-policy-integration-guard-no-api-no-db.md',
  ].forEach(assertFileExists);
});

test('closure note summarizes Task735-738 pure policy boundary', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task735-738 close the Brand Channel Basic pure-policy branch/,
      /deterministic source recognition/,
      /deterministic triage/,
      /pure composition guards/,
      /does not implement API, DB, migration, provider, webhook, verification, Case Binding, audit persistence, entitlement, Brand AI\/RAG, reports, templates, or customer access runtime/,
    ],
    'Task735-738 closure note',
  );
});

test('pure policy modules do not import DB repository API provider LINE runtime webhook AI env fs network logger or config', () => {
  const source = [
    read('src/brandChannel/brandReferralSourcePolicy.js'),
    read('src/brandChannel/brandChannelTriagePolicy.js'),
  ].join('\n');

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /import\s+/);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|router|express|logger|config|openai|rag|webhook/i);
});

test('referral policy closure preserves no identity verification Case Binding or case-data access grants', () => {
  const source = read('src/brandChannel/brandReferralSourcePolicy.js') +
    '\n' +
    read('tests/brandChannel/brandReferralSourcePolicy.unit.test.js') +
    '\n' +
    read('tests/brandChannel/brandReferralTriagePolicy.integration.test.js');

  assertContainsAll(
    source,
    [
      /identityVerified: false/,
      /caseBinding: false/,
      /caseDataAccess: false/,
      /unknown_source_fails_safe/,
      /line_context_cross_scope_fails_safe/,
      /line_context_unscoped_metadata_only/,
    ],
    'Referral policy no-access closure',
  );
});

test('scoped LINE metadata requires organization, channel, and user while raw line user id is not returned', () => {
  const source = read('src/brandChannel/brandReferralSourcePolicy.js') +
    '\n' +
    read('tests/brandChannel/brandReferralSourcePolicy.unit.test.js') +
    '\n' +
    read('tests/brandChannel/brandReferralTriagePolicy.integration.test.js');

  assertContainsAll(
    source,
    [
      /organizationId && lineChannelId && lineUserId/,
      /lineChannelId: lineScope\.lineChannelId/,
      /hasScopedLineContext: lineScope\.scoped/,
      /hasRawLineUserId: lineScope\.hasRawLineUserId/,
      /Object\.prototype\.hasOwnProperty\.call\(referral\.metadata, 'lineUserId'\), false/,
      /assertNoSensitiveEcho\(referral\)/,
    ],
    'Scoped LINE metadata closure',
  );
});

test('triage closure routes existing case inquiries through verification or customer-visible policy, not direct case data', () => {
  const source = read('src/brandChannel/brandChannelTriagePolicy.js') +
    '\n' +
    read('tests/brandChannel/brandChannelTriagePolicy.unit.test.js');

  assertContainsAll(
    source,
    [
      /verification_and_case_binding_required/,
      /verify_customer_and_bind_case/,
      /customer_visible_case_policy_required/,
      /apply_customer_visible_data_policy/,
      /caseDataAccessGrantedByPolicy: false/,
    ],
    'Existing case triage closure',
  );
});

test('triage closure keeps product questions on knowledge path and complaint high-risk on human path', () => {
  const source = read('src/brandChannel/brandChannelTriagePolicy.js') +
    '\n' +
    read('tests/brandChannel/brandChannelTriagePolicy.unit.test.js');

  assertContainsAll(
    source,
    [
      /brand_authorized_knowledge_future_path/,
      /use_brand_authorized_knowledge_only/,
      /human_escalation_required/,
      /create_escalation_or_complaint_record/,
      /high_risk_human_required/,
      /liabilityDecisionAllowed: false/,
      /compensationPromiseAllowed: false/,
      /quoteSettlementApprovalAllowed: false/,
      /complaintClosureAllowed: false/,
    ],
    'Brand triage route closure',
  );
});

test('closure guard preserves unsafe value and payload redaction in pure policy tests', () => {
  const source = [
    read('tests/brandChannel/brandReferralSourcePolicy.unit.test.js'),
    read('tests/brandChannel/brandChannelTriagePolicy.unit.test.js'),
    read('tests/brandChannel/brandReferralTriagePolicy.integration.test.js'),
  ].join('\n');

  assertContainsAll(
    source,
    [
      /credential-placeholder/,
      /raw-provider-payload/,
      /full customer payload/,
      /assertNoSensitiveEcho/,
      /line-user-/,
      /0912/,
    ],
    'Unsafe value redaction closure',
  );
});

test('Task738 closure document keeps no-runtime decision explicit', () => {
  const source = read('docs/task-738-brand-channel-basic-policy-branch-closure-guard-no-api-no-db.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Scope: pure static closure guard \/ no API \/ no DB/,
      /No runtime adoption was performed/,
      /No API, DB, migration, provider, LINE, webhook, AI\/RAG, entitlement, billing, admin, package, or smoke behavior was changed/,
    ],
    'Task738 closure doc',
  );
});
