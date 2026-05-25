'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertFileExists(relativePath) {
  assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`);
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
}

test('Task739 through Task742 evidence docs and tests exist before closure', () => {
  [
    'docs/task-739-multi-official-line-channels-per-brand-design-baseline-docs-only-no-runtime.md',
    'docs/task-740-multi-official-line-channel-identity-scope-static-guard-docs-only-no-runtime.md',
    'docs/task-741-multi-official-line-channel-config-allowed-flow-policy-no-api-no-db.md',
    'docs/task-742-brand-multi-channel-referral-triage-allowed-flow-integration-guard-no-api-no-db.md',
    'tests/docs/multiOfficialLineChannelIdentityScope.static.test.js',
    'tests/brandChannel/multiLineChannelPolicy.unit.test.js',
    'tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js',
  ].forEach(assertFileExists);
});

test('closure note summarizes Task739-743 accepted boundary', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task739-743 close the Multi Official LINE Channels per Brand docs\/pure-policy branch/,
      /multiple official LINE channels per brand/,
      /channel purpose \/ allowed flow/,
      /channel-level Brand Knowledge AI \/ RAG boundary/,
      /verification plus Case Binding/,
      /does not implement API, DB, migration, provider, webhook, LINE signature verification, identity binding, Case Binding, entitlement, audit writer, usage tracking, reports, admin UI, or AI\/RAG runtime/,
    ],
    'Task739-743 closure note',
  );
});

test('docs preserve multi-channel brand boundary and reject single line_channel_id assumptions', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md') +
    '\n' +
    read('docs/PROJECT_GUARDRAILS.md');

  assertContainsAll(
    source,
    [
      /A brand or organization may operate multiple official LINE channels/,
      /must not assume a single `brand_id` maps to a single `line_channel_id`/,
      /系統不得假設 brand 只有單一 `line_channel_id`/,
    ],
    'multi-channel brand boundary',
  );
});

test('line_user_id scope and raw line user redaction remain guarded', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md') +
    '\n' +
    read('tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js') +
    '\n' +
    read('tests/brandChannel/brandReferralTriagePolicy.integration.test.js');

  assertContainsAll(
    source,
    [
      /`line_user_id` is not global identity/,
      /organization_id \+ line_channel_id \+ line_user_id/,
      /Object\.prototype\.hasOwnProperty\.call\(referral\.metadata, 'lineUserId'\), false/,
      /assertNoSensitiveEcho\(referral, channel\)/,
    ],
    'line user scope and redaction',
  );
});

test('cross-channel merge and unverified case-data access remain forbidden', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /must not silently merge customer identity across LINE channels, providers, brands, or organizations/,
      /merge customer identity across channels, it must require verification, permission, conflict handling, and audit log/,
      /No brand LINE channel can provide customer-facing case data until identity verification and Case Binding have succeeded/,
      /case progress, appointment status, reschedule, missing information, customer-facing completion report, issue reporting, dispute status/,
    ],
    'merge and unverified access boundary',
  );
});

test('multiLineChannelPolicy remains pure without runtime imports', () => {
  const source = read('src/brandChannel/multiLineChannelPolicy.js');

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /import\s+/);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|router|express|logger|openai|entitlement/i);
});

test('campaign sales membership and dealer channels cannot direct case query or customer access', () => {
  const source = read('tests/brandChannel/multiLineChannelPolicy.unit.test.js') +
    '\n' +
    read('tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js');

  assertContainsAll(
    source,
    [
      /campaign sales membership and dealer channels cannot directly query case data/,
      /sales_membership/,
      /dealer_channel/,
      /campaign/,
      /case_query/,
      /flow_not_allowed_for_channel_purpose/,
    ],
    'campaign sales dealer deny case query',
  );
});

test('repair intake and service status case flows require verification and Case Binding', () => {
  const source = read('tests/brandChannel/multiLineChannelPolicy.unit.test.js') +
    '\n' +
    read('tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js');

  assertContainsAll(
    source,
    [
      /repair intake and service status case flows require verification and Case Binding/,
      /verification_and_case_binding_required/,
      /customer_visible_case_policy_required/,
      /apply_customer_visible_data_policy/,
      /caseDataAccessGrantedByPolicy, false/,
    ],
    'case flow verification guard',
  );
});

test('Brand Knowledge AI remains channel-level and does not invoke AI runtime', () => {
  const source = read('src/brandChannel/multiLineChannelPolicy.js') +
    '\n' +
    read('tests/brandChannel/multiLineChannelPolicy.unit.test.js') +
    '\n' +
    read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /aiRagEnabled/,
      /knowledgeBaseId/,
      /brand_knowledge_ai_channel_scope_only/,
      /use_channel_authorized_knowledge_base_only/,
      /aiRagRuntimeInvoked: false/,
      /Brand Knowledge AI \/ RAG should be channel-level/,
    ],
    'channel-level Brand Knowledge AI guard',
  );
});

test('SaaS packaging keeps multi-channel depth out of Basic by default', () => {
  const source = read('docs/design/saas-plan-entitlement-and-add-ons.md');

  assertContainsAll(
    source,
    [
      /Basic should not include brand official LINE webhook, Brand Knowledge AI\/RAG, multiple LINE channels/,
      /channel-specific templates/,
      /channel-specific knowledge bases/,
      /channel-level usage tracking/,
      /channel-level audit/,
      /should not be enabled for Basic by default/,
    ],
    'SaaS multi-channel add-on boundary',
  );
});
