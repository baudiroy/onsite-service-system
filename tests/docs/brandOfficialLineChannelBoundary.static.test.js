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

test('brand official LINE design doc preserves Basic platform capability boundary', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Basic Platform Capability/,
      /brand source recognition/,
      /referral_source/,
      /brand repair intake link or platform repair intake link/,
      /customer phone verification/,
      /Case Binding/,
      /Customer Access basic inquiry after verification/,
      /contact history/,
      /audit log/,
    ],
    'Brand LINE design doc',
  );
});

test('brand official LINE design doc keeps high-cost channel and AI features out of Basic default', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Advanced \/ Enterprise Add-on/,
      /brand official LINE webhook integration/,
      /brand knowledge base \/ Brand Knowledge RAG/,
      /Brand Knowledge AI/,
      /multiple LINE channels/,
      /brand-specific customer-facing templates/,
      /brand-specific reports and referral analysis/,
      /brand channel-level usage tracking/,
      /brand-specific customer-service handoff \/ escalation/,
      /must not be included in Basic by default/,
    ],
    'Brand LINE add-on boundary',
  );
});

test('saas add-on design doc packages brand LINE, RAG, AI, and multi-channel features outside Basic default', () => {
  const source = readDoc('docs/design/saas-plan-entitlement-and-add-ons.md');

  assertContainsAll(
    source,
    [
      /High-cost or high-risk features should not be included in Basic by default/,
      /brand official LINE webhook/,
      /multiple LINE channels/,
      /Brand Knowledge AI/,
      /brand knowledge \/ RAG/,
      /deep customer-service routing/,
      /advanced brand reports/,
      /Brand official LINE integration should be packaged as an add-on or Enterprise feature/,
      /brand channel-level usage tracking/,
    ],
    'SaaS add-on design doc',
  );
});

test('brand LINE identity is channel entry only and requires scoped identity plus Case Binding', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand official LINE is a customer entry channel, not case identity/,
      /line_user_id` is not global identity/,
      /organization_id \+ line_channel_id \+ line_user_id/,
      /Brand official LINE entry does not prove the user owns a Case/,
      /Unverified customers cannot query case data/,
      /Customer-visible case data requires verification and Case Binding/,
    ],
    'Brand LINE identity boundary',
  );
});

test('brand LINE triage and AI layers remain separated by source and visibility boundary', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand product \/ official information question/,
      /New repair \/ installation request/,
      /Existing case inquiry \/ reschedule \/ missing data \/ completion issue/,
      /Complaint \/ dispute \/ high-risk issue/,
      /Brand Knowledge AI/,
      /brand-authorized knowledge base \/ approved RAG source/,
      /Customer Case AI/,
      /verified customer's own customer-visible case data/,
      /Internal Service AI/,
      /according to role permission and organization scope/,
    ],
    'Brand LINE triage and AI layering',
  );
});

test('brand LINE docs forbid unsafe customer-facing disclosure to unverified users', () => {
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
      /cross-organization data/,
    ],
    'Brand LINE data visibility boundary',
  );
});
