'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

function readDoc(relativePath) {
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

test('Task727 through Task733 branch evidence docs exist before closure', () => {
  [
    'docs/task-727-brand-official-line-channel-integration-baseline-docs-only-no-runtime.md',
    'docs/task-728-brand-official-line-add-on-boundary-static-guard-docs-only-no-runtime.md',
    'docs/task-730-brand-channel-identity-scope-static-guard-docs-only-no-runtime.md',
    'docs/task-731-brand-channel-triage-ai-boundary-static-guard-docs-only-no-runtime.md',
    'docs/task-732-brand-official-line-saas-entitlement-add-on-static-guard-docs-only-no-runtime.md',
    'docs/task-733-brand-channel-referral-contact-audit-trail-static-guard-docs-only-no-runtime.md',
  ].forEach(assertFileExists);
});

test('closure note summarizes Task727-734 accepted boundary', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Task727-734 Docs-static Branch Closure/,
      /Basic keeps brand source recognition, referral \/ routing, repair intake link, verification, Case Binding, Customer Access after verification, contact history, and audit log/,
      /Professional \/ Enterprise \/ add-on capabilities cover brand official LINE webhook/,
      /Brand official LINE is a customer entry channel only, not case identity/,
      /line_user_id` must be scoped by `organization_id \+ line_channel_id \+ line_user_id/,
      /Future runtime requires explicit API, DB \/ migration, permission, audit, provider, LINE, AI\/RAG, and entitlement scope/,
    ],
    'Brand LINE branch closure note',
  );
});

test('closure preserves Basic versus Professional Enterprise add-on separation', () => {
  const source = readDoc('docs/design/saas-plan-entitlement-and-add-ons.md') +
    '\n' +
    readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Basic should not include brand official LINE webhook/,
      /Brand Knowledge AI\/RAG/,
      /multiple LINE channels/,
      /deep customer-service routing/,
      /provider adapter customization/,
      /brand channel usage analytics/,
      /Enterprise or add-on may include/,
      /stronger audit, permission, AI\/RAG, and provider governance/,
    ],
    'Brand LINE plan separation closure',
  );
});

test('closure preserves brand LINE identity and Case Binding boundary', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand official LINE is a customer entry channel, not case identity/,
      /line_user_id` is not global identity/,
      /LINE identity must be scoped by `organization_id \+ line_channel_id \+ line_user_id`/,
      /customer_channel_identity` or equivalent customer binding must not be created from LINE id alone/,
      /Unverified customers cannot query case progress/,
      /Customer-visible case data requires verification and Case Binding/,
    ],
    'Brand LINE identity closure',
  );
});

test('closure preserves separate triage categories and AI layers', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand product \/ official information question/,
      /New repair \/ installation request/,
      /Existing case inquiry \/ reschedule \/ missing data \/ completion issue/,
      /Complaint \/ dispute \/ high-risk issue/,
      /### Brand Knowledge AI/,
      /### Customer Case AI/,
      /### Internal Service AI/,
      /Brand Knowledge AI must not read customer case data/,
      /Customer Case AI may answer only verified customer's own customer-visible case data/,
      /Internal Service AI outputs must not expose internal data to customers/,
    ],
    'Brand LINE triage and AI closure',
  );
});

test('closure preserves referral contact audit trail and sensitive value redaction', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Audit and Contact History/,
      /brand entry source/,
      /verification attempt/,
      /Case Binding success \/ failure/,
      /customer access after verification/,
      /must remain organization-scoped and tenant-isolated/,
      /must not contain tokens, secrets, LINE access tokens, LINE channel secrets/,
      /raw provider payloads/,
      /full customer payloads/,
    ],
    'Brand LINE audit closure',
  );
});

test('closure preserves no-runtime and explicit future scope boundary', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /This design does not implement/,
      /webhook runtime/,
      /customer verification runtime/,
      /Case Binding runtime/,
      /entitlement runtime/,
      /Brand AI \/ RAG runtime/,
      /API, DB schema, migration, smoke test, or package changes/,
    ],
    'Brand LINE no-runtime closure',
  );
});

test('closure has task document with no runtime decision', () => {
  const source = readDoc('docs/task-734-brand-official-line-docs-static-branch-closure-guard-no-runtime.md');

  assertContainsAll(
    source,
    [
      /Status: completed/,
      /Scope: docs-only static guard \/ no runtime change/,
      /No runtime implementation was performed/,
      /No API, DB, migration, provider, LINE, AI\/RAG, entitlement, billing, admin, package, or smoke behavior was changed/,
    ],
    'Task734 closure doc',
  );
});
