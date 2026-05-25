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

test('brand official LINE triage keeps product, intake, case, and high-risk issues separate', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand Official LINE Triage/,
      /Brand product \/ official information question/,
      /New repair \/ installation request/,
      /Existing case inquiry \/ reschedule \/ missing data \/ completion issue/,
      /Complaint \/ dispute \/ high-risk issue/,
    ],
    'Brand channel triage categories',
  );
});

test('brand product questions are limited to brand-authorized knowledge and Brand Knowledge AI', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Brand product questions may use brand-authorized knowledge base and Brand Knowledge AI/,
      /Brand Knowledge AI may answer/,
      /brand product information/,
      /warranty and official process/,
      /FAQ/,
      /low-risk official troubleshooting/,
      /brand-authorized knowledge base \/ approved RAG source/,
      /must not freely guess brand policy, pricing, warranty, authorized service relationships, compensation, or liability/,
    ],
    'Brand Knowledge AI source boundary',
  );
});

test('existing case inquiries require verification and Case Binding before case disclosure', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Existing case inquiries must route through verification and Case Binding/,
      /Customer-visible case data requires verification and Case Binding/,
      /Unverified customers cannot query case progress/,
      /Do not push full case details to uncertain channel identity/,
      /customer-facing case data must not be disclosed until identity verification and Case Binding succeed/,
    ],
    'Customer case verification boundary',
  );
});

test('complaint dispute and high-risk flows route to human escalation and forbid AI final decisions', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Complaints, disputes, and high-risk issues should create escalation \/ complaint record and route to human handling/,
      /AI must not determine liability/,
      /promise compensation/,
      /approve quote \/ settlement/,
      /close complaint/,
    ],
    'High-risk brand channel escalation boundary',
  );
});

test('Brand Knowledge AI Customer Case AI and Internal Service AI stay separately bounded', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /### Brand Knowledge AI/,
      /### Customer Case AI/,
      /### Internal Service AI/,
      /Brand Knowledge AI must not read customer case data/,
      /Customer Case AI may answer only verified customer's own customer-visible case data/,
      /Internal Service AI may support customer service, dispatch, supervisor, finance, or admin workflows according to role permission and organization scope/,
    ],
    'Brand AI layer split',
  );
});

test('Customer Case AI only reads verified customer-visible case data', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /Customer Case AI may answer only verified customer's own customer-visible case data/,
      /case status/,
      /confirmed appointment/,
      /missing information request/,
      /customer-facing completion report/,
      /issue reporting/,
      /satisfaction survey status/,
      /must not read or output internal notes, internal billing\/settlement data, AI raw payload, supervisor review, unconfirmed suggestions, or cross-customer data/,
    ],
    'Customer Case AI visibility boundary',
  );
});

test('Internal Service AI remains permission scoped and cannot expose internal data to customer channels', () => {
  const source = readDoc('docs/design/brand-official-line-channel-integration.md');

  assertContainsAll(
    source,
    [
      /according to role permission and organization scope/,
      /must not approve quote, settlement, compensation, liability, formal case status, or complaint closure/,
      /must not expose internal data to customers, unverified brand official LINE users/,
      /organization \/ case relationship \/ field-level visibility scope/,
    ],
    'Internal Service AI customer exposure boundary',
  );
});

test('brand LINE webhook, Brand AI, RAG, multi-channel, deep routing, and reports remain add-on or Enterprise', () => {
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
    ],
    'Brand channel add-on packaging boundary',
  );
});
