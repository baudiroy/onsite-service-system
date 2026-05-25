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

const brandChannelDocPath = 'docs/design/brand-official-line-channel-integration.md';
const guardrailsDocPath = 'docs/PROJECT_GUARDRAILS.md';

test('docs state one brand or organization may have multiple official LINE channels', () => {
  const source = readDoc(brandChannelDocPath) + '\n' + readDoc(guardrailsDocPath);

  assertContainsAll(
    source,
    [
      /Multiple Official LINE Channels per Brand/,
      /A brand or organization may operate multiple official LINE channels/,
      /同一品牌或 organization 可有多個 official LINE channel/,
    ],
    'multi official LINE channel baseline',
  );
});

test('docs forbid brand to single line_channel_id assumptions', () => {
  const source = readDoc(brandChannelDocPath) + '\n' + readDoc(guardrailsDocPath);

  assertContainsAll(
    source,
    [
      /must not assume a single `brand_id` maps to a single `line_channel_id`/,
      /系統不得假設 brand 只有單一 `line_channel_id`/,
    ],
    'single line channel assumption guard',
  );
});

test('LINE identity scope remains organization plus channel plus user', () => {
  const source = readDoc(brandChannelDocPath) + '\n' + readDoc(guardrailsDocPath);

  assertContainsAll(
    source,
    [
      /`line_user_id` is not global identity/,
      /organization_id \+ line_channel_id \+ line_user_id/,
      /`line_user_id` 必須依 `organization_id \+ line_channel_id \+ line_user_id` scope 處理/,
    ],
    'LINE identity scope',
  );
});

test('line_user_id alone never grants customer identity Case Binding or case-data access', () => {
  const source = readDoc(brandChannelDocPath);

  assertContainsAll(
    source,
    [
      /The LINE channel is an entry channel, not brand identity and not customer identity/,
      /customer_channel_identity` or equivalent customer binding must not be created from LINE id alone/,
      /Brand official LINE entry does not prove the user owns a Case/,
      /No brand LINE channel can provide customer-facing case data until identity verification and Case Binding have succeeded/,
    ],
    'LINE id no direct grant boundary',
  );
});

test('cross-channel provider organization silent customer identity merge is forbidden', () => {
  const source = readDoc(brandChannelDocPath);

  assertContainsAll(
    source,
    [
      /must not silently merge customer identity across LINE channels, providers, brands, or organizations/,
      /merge customer identity across channels, it must require verification, permission, conflict handling, and audit log/,
      /Verification and Case Binding must be repeated or revalidated when channel context is uncertain/,
    ],
    'cross-channel identity merge guard',
  );
});

test('channel concept includes purpose allowed flow knowledge usage and audit fields', () => {
  const source = readDoc(brandChannelDocPath);

  assertContainsAll(
    source,
    [
      /`organization_id`/,
      /`brand_id`/,
      /`line_channel_id`/,
      /channel name/,
      /channel purpose/,
      /status/,
      /owner department/,
      /allowed flow/,
      /default language/,
      /message template/,
      /`knowledge_base_id`/,
      /AI \/ RAG enablement/,
      /usage tracking/,
      /channel audit log/,
    ],
    'brand LINE channel concept',
  );
});

test('channel purposes define allowed-flow boundaries and block campaign sales dealer case querying', () => {
  const source = readDoc(brandChannelDocPath);

  assertContainsAll(
    source,
    [
      /`customer_service`/,
      /`repair_intake`/,
      /`service_status`/,
      /`sales_membership`/,
      /`regional_service`/,
      /`dealer_channel`/,
      /`campaign`/,
      /Each channel may execute only its allowed flow/,
      /Campaign, sales, membership, and dealer channels must not become implicit case-query or customer-access channels/,
      /campaign channel may use referral templates only/,
    ],
    'channel purpose allowed-flow guard',
  );
});

test('unverified users cannot query customer-facing case data across channels', () => {
  const source = readDoc(brandChannelDocPath);

  assertContainsAll(
    source,
    [
      /Unverified customers cannot query case progress/,
      /appointments/,
      /missing information requests/,
      /customer-facing completion report/,
      /issue \/ dispute status/,
      /No brand LINE channel can provide customer-facing case data until identity verification and Case Binding have succeeded/,
      /case progress, appointment status, reschedule, missing information, customer-facing completion report, issue reporting, dispute status/,
    ],
    'unverified case-data guard',
  );
});

test('docs do not introduce concrete secrets or credential-like assignments', () => {
  const source = [
    readDoc(brandChannelDocPath),
    readDoc(guardrailsDocPath),
  ].join('\n');

  assert.doesNotMatch(source, /DATABASE_URL\s*=/);
  assert.doesNotMatch(source, /LINE_CHANNEL_SECRET\s*=/);
  assert.doesNotMatch(source, /LINE_CHANNEL_ACCESS_TOKEN\s*=/);
  assert.doesNotMatch(source, /OPENAI_API_KEY\s*=/);
  assert.doesNotMatch(source, /\b(password|token|secret)\s*[:=]\s*['"][^'"]+['"]/i);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9]{20,}/);
});
