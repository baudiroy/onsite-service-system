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

test('Task735 through Task745 evidence docs and tests exist before closure', () => {
  [
    'docs/task-735-brand-referral-source-recognition-policy-baseline-no-api-no-db.md',
    'docs/task-736-brand-channel-triage-policy-baseline-no-ai-no-db.md',
    'docs/task-737-brand-referral-triage-policy-integration-guard-no-api-no-db.md',
    'docs/task-741-multi-official-line-channel-config-allowed-flow-policy-no-api-no-db.md',
    'docs/task-742-brand-multi-channel-referral-triage-allowed-flow-integration-guard-no-api-no-db.md',
    'docs/task-744-brand-referral-intake-request-normalizer-no-api-no-db.md',
    'docs/task-745-brand-referral-normalizer-channel-flow-integration-guard-no-api-no-db.md',
    'tests/brandChannel/brandReferralSourcePolicy.unit.test.js',
    'tests/brandChannel/brandChannelTriagePolicy.unit.test.js',
    'tests/brandChannel/brandReferralTriagePolicy.integration.test.js',
    'tests/brandChannel/multiLineChannelPolicy.unit.test.js',
    'tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js',
    'tests/brandChannel/brandReferralRequestNormalizer.unit.test.js',
    'tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js',
  ].forEach(assertFileExists);
});

test('closure note summarizes Task735-746 accepted pure-policy boundary', () => {
  const source = read('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task735-746 close the Basic Brand Referral pure-policy branch/,
      /source recognition/,
      /triage/,
      /multi-channel allowed-flow policy/,
      /request normalizer/,
      /integration guards/,
      /does not implement API, DB, migration, provider, webhook, LINE signature verification, identity verification, Case Binding, repair intake creation, audit writer, contact log, entitlement, usage tracking, reports, admin UI, or AI\/RAG runtime/,
    ],
    'Task735-746 closure note',
  );
});

test('pure brandChannel modules avoid forbidden runtime imports and calls', () => {
  const modulePaths = [
    'src/brandChannel/brandReferralSourcePolicy.js',
    'src/brandChannel/brandChannelTriagePolicy.js',
    'src/brandChannel/multiLineChannelPolicy.js',
    'src/brandChannel/brandReferralRequestNormalizer.js',
  ];
  const modules = modulePaths.map(read).join('\n');

  assert.doesNotMatch(modules, /process\.env/);
  assert.doesNotMatch(modules, /fetch\(/);
  assert.doesNotMatch(modules, /axios|openai|new\s+Pool|createPool|express\(/i);
  assert.doesNotMatch(modules, /require\('node:(fs|http|https|net|child_process)'\)/);

  const requireTargets = modulePaths.flatMap((relativePath) => (
    Array.from(read(relativePath).matchAll(/require\('([^']+)'\)/g))
      .map((match) => match[1])
  ));
  assert.deepEqual(requireTargets, ['./brandReferralSourcePolicy']);
});

test('referral and request metadata never grants identity Case Binding case access intake creation or audit write', () => {
  const source = [
    read('src/brandChannel/brandReferralSourcePolicy.js'),
    read('src/brandChannel/brandReferralRequestNormalizer.js'),
    read('tests/brandChannel/brandReferralSourcePolicy.unit.test.js'),
    read('tests/brandChannel/brandReferralRequestNormalizer.unit.test.js'),
    read('tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js'),
  ].join('\n');

  assertContainsAll(
    source,
    [
      /identityVerified: false/,
      /caseBinding: false/,
      /caseDataAccess: false/,
      /intakeCreated: false/,
      /auditWritten: false/,
      /unknown_source_fails_safe/,
    ],
    'metadata no-grant closure',
  );
});

test('raw line user id is not returned and scoped LINE context remains metadata only', () => {
  const source = [
    read('src/brandChannel/brandReferralSourcePolicy.js'),
    read('src/brandChannel/brandReferralRequestNormalizer.js'),
    read('tests/brandChannel/brandReferralRequestNormalizer.unit.test.js'),
    read('tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js'),
  ].join('\n');

  assertContainsAll(
    source,
    [
      /organizationId && lineChannelId && lineUserId/,
      /line_channel_id: metadata\.lineChannelId/,
      /has_scoped_line_context: metadata\.hasScopedLineContext/,
      /Object\.prototype\.hasOwnProperty\.call\(normalized\.metadata, 'line_user_id'\), false/,
      /assertNoSensitiveEcho\(normalized/,
    ],
    'scoped LINE metadata closure',
  );
});

test('campaign sales membership and dealer channels cannot direct case query or customer access', () => {
  const source = [
    read('tests/brandChannel/multiLineChannelPolicy.unit.test.js'),
    read('tests/brandChannel/brandMultiChannelReferralTriage.integration.test.js'),
    read('tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js'),
  ].join('\n');

  assertContainsAll(
    source,
    [
      /campaign sales membership and dealer channels cannot directly query case data/,
      /campaign sales membership and dealer channels fail closed for direct case query/,
      /sales_membership/,
      /dealer_channel/,
      /campaign/,
      /flow_not_allowed_for_channel_purpose/,
    ],
    'restricted channel case query closure',
  );
});

test('repair intake and service status case flows require verification and Case Binding rather than direct case data', () => {
  const source = [
    read('src/brandChannel/multiLineChannelPolicy.js'),
    read('src/brandChannel/brandChannelTriagePolicy.js'),
    read('tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js'),
  ].join('\n');

  assertContainsAll(
    source,
    [
      /case_related_flow_requires_verification_case_binding/,
      /verification_and_case_binding_required/,
      /verify_customer_and_bind_case/,
      /customer_visible_case_policy_required/,
      /apply_customer_visible_data_policy/,
      /caseDataAccessGrantedByPolicy: false/,
    ],
    'case flow verification closure',
  );
});

test('product questions route only to brand-authorized knowledge future path and no AI runtime call', () => {
  const source = [
    read('src/brandChannel/brandChannelTriagePolicy.js'),
    read('src/brandChannel/multiLineChannelPolicy.js'),
    read('tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js'),
  ].join('\n');

  assertContainsAll(
    source,
    [
      /brand_authorized_knowledge_future_path/,
      /use_brand_authorized_knowledge_only/,
      /brand_knowledge_ai_channel_scope_only/,
      /use_channel_authorized_knowledge_base_only/,
      /aiRagRuntimeInvoked: false/,
    ],
    'brand knowledge closure',
  );
});

test('unsafe extras are stripped or ignored across pure branch coverage', () => {
  const source = [
    read('tests/brandChannel/brandReferralSourcePolicy.unit.test.js'),
    read('tests/brandChannel/brandReferralRequestNormalizer.unit.test.js'),
    read('tests/brandChannel/brandReferralNormalizerChannelFlow.integration.test.js'),
  ].join('\n');

  assertContainsAll(
    source,
    [
      /credential-placeholder/,
      /raw-provider-payload/,
      /raw-ai-payload/,
      /full customer payload/,
      /DATABASE_URL/,
      /assertNoSensitiveEcho/,
      /line-user-/,
      /0912/,
    ],
    'unsafe extras redaction closure',
  );
});

test('Task746 closure document keeps no-runtime decision explicit', () => {
  const source = read('docs/task-746-basic-brand-referral-policy-branch-closure-guard-no-runtime.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Scope: pure static closure guard \/ no API \/ no DB \/ no runtime/,
      /No runtime adoption was performed/,
      /No API, DB, migration, provider, LINE, webhook, identity verification, Case Binding, repair intake creation, audit\/contact persistence, AI\/RAG, entitlement, billing, admin, package, or smoke behavior was changed/,
    ],
    'Task746 closure doc',
  );
});
