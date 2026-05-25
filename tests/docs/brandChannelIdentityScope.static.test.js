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

test('brand official LINE is entry channel only, not case identity', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand official LINE is a customer entry channel, not case identity/,
      /brand official LINE identity as channel identity only/,
      /Brand official LINE entry does not prove the user owns a Case/,
      /customer-facing case data must not be disclosed until identity verification and Case Binding succeed/,
    ],
    'Brand channel identity scope',
  );
});

test('LINE identity and customer channel binding require scoped verification', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /`line_user_id` is not global identity/,
      /organization_id \+ line_channel_id \+ line_user_id/,
      /customer_channel_identity` or equivalent customer binding must not be created from LINE id alone/,
      /Customer-visible case data requires verification and Case Binding/,
      /phone verification, token, case number plus partial phone verification, or existing trusted LINE \/ App identity/,
    ],
    'Brand LINE scoped binding rule',
  );
});

test('unverified brand LINE users cannot query customer-visible case data', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Unverified customers cannot query case progress/,
      /appointments/,
      /missing information requests/,
      /customer-facing completion report/,
      /issue \/ dispute status/,
      /any other customer-visible case data/,
      /Do not push full case details to uncertain channel identity/,
    ],
    'Unverified brand LINE access boundary',
  );
});

test('brand product questions and case questions are triaged separately', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand Official LINE Triage/,
      /Brand product \/ official information question/,
      /New repair \/ installation request/,
      /Existing case inquiry \/ reschedule \/ missing data \/ completion issue/,
      /Complaint \/ dispute \/ high-risk issue/,
      /Brand product questions may use brand-authorized knowledge base and Brand Knowledge AI/,
      /Existing case inquiries must route through verification and Case Binding/,
    ],
    'Brand LINE triage split',
  );
});

test('cross-scope access is forbidden for brand channel identity flows', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Cross-organization and cross-tenant case access is forbidden/,
      /cross-customer data/,
      /cross-organization data/,
      /according to role permission and organization scope/,
      /permission denied/,
      /cross-scope denied/,
    ],
    'Cross-scope brand channel guard',
  );
});

test('unverified brand LINE users cannot see internal or sensitive case context', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /must not expose the following to unverified users or unauthorized brand-side users/,
      /internal notes/,
      /raw audit log content/,
      /AI raw payload/,
      /billing \/ settlement internal data/,
      /engineer internal comments/,
      /supervisor review/,
      /unconfirmed appointment suggestions/,
      /finalAppointmentId/,
      /full PII/,
    ],
    'Unverified sensitive visibility guard',
  );
});

test('project guardrails cross-reference the canonical brand channel identity boundary', () => {
  const source = readDoc('docs/PROJECT_GUARDRAILS.md');

  assertContainsAll(
    source,
    [
      /Brand Official LINE \/ Brand Channel Integration/,
      /品牌官方 LINE 是 customer entry channel，不是 case identity/,
      /line_user_id` 必須依 `organization_id \+ line_channel_id \+ line_user_id` scope 處理/,
      /未驗證客戶不得查詢案件資料/,
      /docs\/design\/brand-official-line-channel-integration.md/,
    ],
    'PROJECT_GUARDRAILS brand LINE summary',
  );
});
