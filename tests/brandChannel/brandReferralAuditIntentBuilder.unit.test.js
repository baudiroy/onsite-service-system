'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  BRAND_REFERRAL_AUDIT_EVENT_TYPES,
  buildBrandReferralAuditIntent,
} = require('../../src/brandChannel/brandReferralAuditIntentBuilder');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertNoSensitiveEcho(value) {
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized, /line-user-placeholder/);
  assert.doesNotMatch(serialized, /full-phone-placeholder/);
  assert.doesNotMatch(serialized, /full-address-placeholder/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
}

test('intent builder remains pure and imports no side-effect runtime', () => {
  const source = read('src/brandChannel/brandReferralAuditIntentBuilder.js');

  [
    /require\(/,
    /process\.env/,
    /fetch\(/,
    /axios|pg|pool|repository|provider|webhook|sms|openai|rag|billing|entitlement/i,
    /lineProvider|lineWebhook|lineSignature|lineAccessToken|lineChannelSecret/i,
    /verifyIdentity|verifyCustomer|caseBinding|bindCase|createCase|createRepairIntake/i,
    /writeAudit|auditWriter|writeContact|contactLog|dispatchNote/i,
    /require\('node:(fs|http|https|net|child_process)'\)/,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});

test('builds allowed normalization intent from route response envelope', () => {
  const intent = buildBrandReferralAuditIntent({
    ok: true,
    referral: {
      metadata: {
        organization_id: 'org-1',
        brand_id: 'brand-a',
        source_channel: 'brand_line',
        referral_source: 'official_line',
        entry_context: 'repair_entry',
        line_channel_id: 'line-channel-1',
        line_user_id: 'line-user-placeholder',
      },
    },
  }, {
    timestamp: '2026-05-22T10:00:00.000Z',
  });

  assert.deepEqual(intent, {
    eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.normalized,
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_line',
    referral_source: 'official_line',
    entry_context: 'repair_entry',
    line_channel_id: 'line-channel-1',
    reasonKey: undefined,
    resultStatus: 'normalized',
    timestamp: '2026-05-22T10:00:00.000Z',
    auditWritten: false,
    contactWritten: false,
  });
  assertNoSensitiveEcho(intent);
});

test('builds denied intent from access-denied envelope without referral output', () => {
  const intent = buildBrandReferralAuditIntent({
    body: {
      ok: false,
      reasonKey: 'brand_referral_permission_denied',
      access: {
        metadata: {
          organization_id: 'org-1',
          brand_id: 'brand-a',
          source_channel: 'brand_line',
          referral_source: 'official_line',
          line_channel_id: 'line-channel-1',
          line_user_id: 'line-user-placeholder',
        },
      },
    },
  });

  assert.equal(intent.eventType, BRAND_REFERRAL_AUDIT_EVENT_TYPES.denied);
  assert.equal(intent.resultStatus, 'denied');
  assert.equal(intent.reasonKey, 'brand_referral_permission_denied');
  assert.equal(intent.organization_id, 'org-1');
  assert.equal(intent.line_channel_id, 'line-channel-1');
  assert.equal(intent.auditWritten, false);
  assert.equal(intent.contactWritten, false);
  assertNoSensitiveEcho(intent);
});

test('malformed input produces safe minimal intent without throwing', () => {
  const intent = buildBrandReferralAuditIntent('not-an-object');

  assert.equal(intent.eventType, BRAND_REFERRAL_AUDIT_EVENT_TYPES.malformed);
  assert.equal(intent.resultStatus, 'malformed');
  assert.equal(intent.auditWritten, false);
  assert.equal(intent.contactWritten, false);
  assertNoSensitiveEcho(intent);
});

test('unknown source produces unknown-source event', () => {
  const intent = buildBrandReferralAuditIntent({
    ok: true,
    referral: {
      metadata: {
        organization_id: 'org-1',
        brand_id: 'brand-a',
        source_channel: 'unknown',
        referral_source: 'unknown',
      },
      reasonKey: 'unknown_source_fails_safe',
    },
  });

  assert.equal(intent.eventType, BRAND_REFERRAL_AUDIT_EVENT_TYPES.unknownSource);
  assert.equal(intent.reasonKey, 'unknown_source_fails_safe');
  assert.equal(intent.resultStatus, 'normalized');
  assertNoSensitiveEcho(intent);
});

test('unsafe extras and raw scoped LINE user values are never copied into intent', () => {
  const intent = buildBrandReferralAuditIntent({
    ok: true,
    metadata: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      referral_source: 'official_line',
      entry_context: 'repair_entry',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-placeholder',
      customer_phone: 'full-phone-placeholder',
      customer_address: 'full-address-placeholder',
      token: 'credential-placeholder',
      raw_provider_payload: 'raw-provider-payload',
      raw_ai_payload: 'raw-ai-payload',
      full_customer_payload: 'full customer payload',
      database_url: 'DATABASE_URL',
    },
  });

  assert.equal(Object.prototype.hasOwnProperty.call(intent, 'line_user_id'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(intent, 'customer_phone'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(intent, 'token'), false);
  assertNoSensitiveEcho(intent);
});

test('explicit event and result options are allowed only as safe intent metadata', () => {
  const intent = buildBrandReferralAuditIntent({
    metadata: {
      organizationId: 'org-2',
      brandId: 'brand-b',
      sourceChannel: 'brand_website',
    },
  }, {
    eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.denied,
    resultStatus: 'denied',
    timestamp: '2026-05-22T11:00:00.000Z',
  });

  assert.equal(intent.eventType, BRAND_REFERRAL_AUDIT_EVENT_TYPES.denied);
  assert.equal(intent.resultStatus, 'denied');
  assert.equal(intent.organization_id, 'org-2');
  assert.equal(intent.brand_id, 'brand-b');
  assert.equal(intent.source_channel, 'brand_website');
  assert.equal(intent.timestamp, '2026-05-22T11:00:00.000Z');
});
