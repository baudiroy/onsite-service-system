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

test('Basic includes only foundational brand source, routing, verification, access, contact, and audit capabilities', () => {
  const source = readDoc('docs/design/saas-plan-entitlement-and-add-ons.md');

  assertContainsAll(
    source,
    [
      /### Basic Capability/,
      /brand source recognition/,
      /brand_id/,
      /source_channel/,
      /referral_source/,
      /repair intake link/,
      /customer verification/,
      /Case Binding/,
      /Customer Access after verification/,
      /contact history/,
      /audit log/,
    ],
    'Basic brand capability boundary',
  );
});

test('Basic excludes brand webhook, RAG, AI, multi-channel, deep routing, provider customization, and brand analytics', () => {
  const source = readDoc('docs/design/saas-plan-entitlement-and-add-ons.md');

  assertContainsAll(
    source,
    [
      /Basic should not include brand official LINE webhook/,
      /Brand Knowledge AI\/RAG/,
      /multiple LINE channels/,
      /deep customer-service routing/,
      /provider adapter customization/,
      /brand channel usage analytics/,
      /brand-specific reports \/ templates beyond basic messaging/,
    ],
    'Basic exclusion boundary',
  );
});

test('Professional may add richer brand templates and reports without full webhook RAG or Brand AI by default', () => {
  const source = readDoc('docs/design/saas-plan-entitlement-and-add-ons.md');

  assertContainsAll(
    source,
    [
      /### Professional Capability/,
      /multi-brand settings/,
      /brand-specific repair entry/,
      /brand-specific customer-facing templates/,
      /brand case source statistics/,
      /brand category and quality reports/,
      /brand settlement categorization/,
      /full brand official LINE webhook, Brand Knowledge AI\/RAG, and multiple LINE channels should remain add-on or Enterprise unless explicitly packaged otherwise/,
    ],
    'Professional brand capability boundary',
  );
});

test('Enterprise and add-on packages contain deep brand LINE, RAG, AI, routing, usage, reports, and governance', () => {
  const source = readDoc('docs/design/saas-plan-entitlement-and-add-ons.md');

  assertContainsAll(
    source,
    [
      /### Enterprise \/ Add-on Capability/,
      /brand official LINE webhook/,
      /multiple LINE channels/,
      /brand LINE rich menu integration/,
      /brand official LINE issue triage/,
      /Brand Knowledge AI/,
      /brand knowledge \/ RAG/,
      /brand-specific reports and referral analysis/,
      /brand channel-level usage tracking/,
      /custom handoff \/ escalation/,
      /stronger audit, permission, AI\/RAG, and provider governance/,
    ],
    'Enterprise add-on brand capability boundary',
  );
});

test('add-on features require entitlement, permission, audit, provider governance, and usage attribution before runtime', () => {
  const source = readDoc('docs/design/saas-plan-entitlement-and-add-ons.md');

  assertContainsAll(
    source,
    [
      /Add-on features require entitlement, user permission, audit log, provider governance, and usage \/ cost attribution before runtime/,
      /Having an entitlement does not grant user permission/,
      /Having permission does not bypass entitlement, organization scope, Data Access Control, audit log, or safety rules/,
      /Usage tracking is not audit log/,
    ],
    'Add-on entitlement guard',
  );
});

test('no plan grants unverified case-data access', () => {
  const source = readDoc('docs/design/saas-plan-entitlement-and-add-ons.md') +
    '\n' +
    readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /No plan may grant unverified case-data access/,
      /Customer Access after verification/,
      /Customer-visible case data requires verification and Case Binding/,
      /Unverified customers cannot query case progress/,
      /customer-facing case data must not be disclosed until identity verification and Case Binding succeed/,
    ],
    'Unverified case-data access guard',
  );
});

test('brand official LINE design agrees that Basic keeps deep channel and AI features out by default', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Basic should not include brand official LINE webhook, brand RAG, Brand Knowledge AI, multiple brand LINE channels, or deep customer-service routing/,
      /These capabilities have higher cost and higher security risk/,
      /They must not be included in Basic by default/,
      /Enterprise or add-on packages may include/,
      /Brand Official LINE Integration Add-on/,
      /Brand Knowledge AI \/ RAG Add-on/,
    ],
    'Brand LINE design add-on alignment',
  );
});
