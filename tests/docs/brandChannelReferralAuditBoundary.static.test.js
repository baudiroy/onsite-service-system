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

test('Basic brand referral captures source, channel, referral, and entry context', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Basic Platform Capability/,
      /brand_id/,
      /source_channel/,
      /referral_source/,
      /brand repair intake link or platform repair intake link/,
      /entry link \/ context where applicable/,
      /contact history/,
      /audit log/,
    ],
    'Basic referral traceability fields',
  );
});

test('brand referral contact and audit trail covers entry verification binding access handoff and complaint routing', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Audit and Contact History/,
      /brand entry source/,
      /brand_id/,
      /source_channel/,
      /referral_source/,
      /verification attempt/,
      /verification success \/ failure/,
      /Case Binding success \/ failure/,
      /customer access after verification/,
      /escalation \/ handoff/,
      /complaint routing/,
    ],
    'Brand referral audit trail',
  );
});

test('contact and audit trail redacts provider secrets raw channel ids provider payloads and full customer payloads', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /must not contain tokens/,
      /secrets/,
      /LINE access tokens/,
      /LINE channel secrets/,
      /full phone values/,
      /full addresses/,
      /raw LINE user ids/,
      /raw provider payloads/,
      /AI raw sensitive payloads/,
      /full customer payloads/,
    ],
    'Brand referral sensitive data redaction',
  );
});

test('brand referral and routing do not verify identity or grant case access by themselves', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand referral \/ routing records do not by themselves verify identity or grant case-data access/,
      /Brand official LINE is a customer entry channel, not case identity/,
      /Brand official LINE entry does not prove the user owns a Case/,
      /Customer-visible case data requires verification and Case Binding/,
      /Unverified customers cannot query case progress/,
    ],
    'Referral is not identity proof',
  );
});

test('audit and contact history remain organization scoped and tenant isolated', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /must remain organization-scoped and tenant-isolated/,
      /Cross-organization and cross-tenant case access is forbidden/,
      /organization_id \+ line_channel_id \+ line_user_id/,
      /cross-organization data/,
      /cross-scope denied/,
    ],
    'Organization scoped referral audit guard',
  );
});

test('Basic referral does not include deep Brand official LINE provider AI or analytics add-ons', () => {
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
    'Basic referral add-on exclusion',
  );
});

test('future brand channel runtime tasks must explicitly mark implementation scope', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Future runtime tasks must explicitly mark API, DB \/ migration, permission, audit, provider, LINE, and AI\/RAG scope before implementation/,
      /This design does not implement/,
      /webhook runtime/,
      /LINE provider adapter/,
      /Brand AI \/ RAG runtime/,
      /API, DB schema, migration, smoke test, or package changes/,
    ],
    'Future runtime scope declaration guard',
  );
});
