'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  BRAND_REFERRAL_AUDIT_EVENT_TYPES,
  buildBrandReferralAuditIntent,
} = require('../../src/brandChannel/brandReferralAuditIntentBuilder');
const {
  BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS,
  BRAND_REFERRAL_AUDIT_CONTACT_TABLE,
} = require('../../src/brandChannel/brandReferralAuditContactRepository');
const {
  ALLOWED_BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS,
  buildAuditContactRow,
  createBrandReferralAuditContactWriter,
} = require('../../src/brandChannel/brandReferralAuditContactWriter');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function requireStatements(source) {
  return source
    .split('\n')
    .filter((line) => line.includes('require('))
    .join('\n');
}

function createFakeDbClient(options = {}) {
  const calls = [];

  return {
    calls,
    insert: async (table, row) => {
      calls.push({ table, row });
      if (options.error) {
        throw options.error;
      }
      return {
        id: 'event-1',
        created_at: row.created_at || '2026-05-22T12:00:00.000Z',
      };
    },
  };
}

function buildSafeIntent(overrides = {}) {
  return {
    ...buildBrandReferralAuditIntent({
      ok: true,
      referral: {
        metadata: {
          organization_id: 'org-1',
          brand_id: 'brand-1',
          source_channel: 'brand_line',
          referral_source: 'official_line',
          entry_context: 'repair_entry',
          line_channel_id: 'line-channel-1',
        },
      },
    }, {
      timestamp: '2026-05-22T12:00:00.000Z',
    }),
    requestId: 'request-1',
    ...overrides,
  };
}

function assertNoSensitiveEcho(value) {
  const serialized = JSON.stringify(value);
  [
    /line-user-placeholder/,
    /full-phone-placeholder/,
    /full-address-placeholder/,
    /full-name-placeholder/,
    /credential-placeholder/,
    /raw-provider-payload/,
    /raw-ai-payload/,
    /full customer payload/i,
    /DATABASE_URL/,
    /SELECT \* FROM/i,
    /stack trace placeholder/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(serialized, pattern);
  });
}

test('repository imports no global DB env config network provider webhook AI route or server code', () => {
  const source = read('src/brandChannel/brandReferralAuditContactRepository.js');
  const imports = requireStatements(source);

  [
    /process\.env/,
    /require\(['"]pg['"]\)/,
    /require\(['"]dotenv['"]\)/,
    /require\(['"]\.\.\/.*(?:db|database|pool|config|server|app|router)/i,
    /fetch\(/,
    /axios|provider|webhook|sms|openai|rag|billing|entitlement/i,
    /lineProvider|lineWebhook|lineSignature|lineAccessToken|lineChannelSecret/i,
    /verifyIdentity|verifyCustomer|caseBinding|bindCase|createCase|createRepairIntake/i,
    /require\('node:(fs|http|https|net|child_process)'\)/,
  ].forEach((pattern) => {
    assert.doesNotMatch(imports, pattern);
  });

  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /\bfetch\(/);
});

test('writer imports no provider webhook AI route global DB env or server code', () => {
  const source = read('src/brandChannel/brandReferralAuditContactWriter.js');
  const imports = requireStatements(source);

  [
    /process\.env/,
    /require\(['"]pg['"]\)/,
    /require\(['"]dotenv['"]\)/,
    /require\(['"]\.\.\/.*(?:db|database|pool|config|server|app|router)/i,
    /fetch\(/,
    /axios|provider|webhook|sms|openai|rag|billing|entitlement/i,
    /lineProvider|lineWebhook|lineSignature|lineAccessToken|lineChannelSecret/i,
    /verifyIdentity|verifyCustomer|caseBinding|bindCase|createCase|createRepairIntake/i,
    /require\('node:(fs|http|https|net|child_process)'\)/,
  ].forEach((pattern) => {
    assert.doesNotMatch(imports, pattern);
  });

  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /\bfetch\(/);
});

test('writer persists only migration 024 safe columns with fake DB', async () => {
  const fakeDb = createFakeDbClient();
  const writer = createBrandReferralAuditContactWriter({ dbClient: fakeDb });
  const result = await writer.write(buildSafeIntent());

  assert.deepEqual(result, {
    ok: true,
    id: 'event-1',
    createdAt: '2026-05-22T12:00:00.000Z',
  });
  assert.equal(fakeDb.calls.length, 1);
  assert.equal(fakeDb.calls[0].table, BRAND_REFERRAL_AUDIT_CONTACT_TABLE);
  assert.deepEqual(Object.keys(fakeDb.calls[0].row).sort(), [
    'brand_id',
    'created_at',
    'entry_context',
    'event_type',
    'line_channel_id',
    'organization_id',
    'referral_source',
    'request_id',
    'result_status',
    'source_channel',
  ]);
  assert.deepEqual(ALLOWED_BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS, BRAND_REFERRAL_AUDIT_CONTACT_COLUMNS);
  assertNoSensitiveEcho(fakeDb.calls[0].row);
});

test('missing injected DB client fails safely without writing', async () => {
  const writer = createBrandReferralAuditContactWriter();
  const result = await writer.write(buildSafeIntent());

  assert.deepEqual(result, {
    ok: false,
    reasonKey: 'brand_referral_audit_contact_db_client_missing',
  });
  assertNoSensitiveEcho(result);
});

test('missing organization id event type and result status fail closed', () => {
  assert.deepEqual(buildAuditContactRow(buildSafeIntent({ organization_id: undefined })).reasonKey, 'brand_referral_audit_contact_organization_required');
  assert.deepEqual(buildAuditContactRow(buildSafeIntent({ eventType: undefined })).reasonKey, 'brand_referral_audit_contact_event_type_invalid');
  assert.deepEqual(buildAuditContactRow(buildSafeIntent({ resultStatus: undefined })).reasonKey, 'brand_referral_audit_contact_result_status_invalid');
});

test('unsafe event type and result status fail closed', () => {
  assert.deepEqual(buildAuditContactRow(buildSafeIntent({ eventType: 'unsafe_event' })).reasonKey, 'brand_referral_audit_contact_event_type_invalid');
  assert.deepEqual(buildAuditContactRow(buildSafeIntent({ resultStatus: 'unsafe_result' })).reasonKey, 'brand_referral_audit_contact_result_status_invalid');
});

test('unsafe extras are rejected before persistence', async () => {
  const fakeDb = createFakeDbClient();
  const writer = createBrandReferralAuditContactWriter({ dbClient: fakeDb });
  const result = await writer.write(buildSafeIntent({
    line_user_id: 'line-user-placeholder',
    customer_phone: 'full-phone-placeholder',
    customer_address: 'full-address-placeholder',
    customer_name: 'full-name-placeholder',
    token: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
    database_url: 'DATABASE_URL',
    sql_input: 'SELECT * FROM secrets',
    stack: 'stack trace placeholder',
    internal_note: 'internal note placeholder',
    billing: 'billing placeholder',
    settlement: 'settlement placeholder',
  }));

  assert.deepEqual(result, {
    ok: false,
    reasonKey: 'brand_referral_audit_contact_unsafe_field',
  });
  assert.equal(fakeDb.calls.length, 0);
  assertNoSensitiveEcho(result);
});

test('DB duplicate timeout and generic errors return safe failure results', async () => {
  const duplicateWriter = createBrandReferralAuditContactWriter({
    dbClient: createFakeDbClient({ error: { code: '23505', stack: 'stack trace placeholder' } }),
  });
  const timeoutWriter = createBrandReferralAuditContactWriter({
    dbClient: createFakeDbClient({ error: { code: 'ETIMEDOUT', message: 'DATABASE_URL credential-placeholder' } }),
  });
  const failedWriter = createBrandReferralAuditContactWriter({
    dbClient: createFakeDbClient({ error: new Error('SELECT * FROM secrets credential-placeholder') }),
  });

  assert.deepEqual(await duplicateWriter.write(buildSafeIntent()), {
    ok: false,
    reasonKey: 'brand_referral_audit_contact_duplicate_request',
  });
  assert.deepEqual(await timeoutWriter.write(buildSafeIntent()), {
    ok: false,
    reasonKey: 'brand_referral_audit_contact_timeout',
  });
  assert.deepEqual(await failedWriter.write(buildSafeIntent()), {
    ok: false,
    reasonKey: 'brand_referral_audit_contact_write_failed',
  });
});

test('writer accepts denied malformed and unknown safe audit intent categories', async () => {
  const fakeDb = createFakeDbClient();
  const writer = createBrandReferralAuditContactWriter({ dbClient: fakeDb });
  const categories = [
    { eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.denied, resultStatus: 'denied' },
    { eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.malformed, resultStatus: 'malformed' },
    { eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.unknownSource, resultStatus: 'unknown' },
  ];

  for (const category of categories) {
    const result = await writer.write(buildSafeIntent(category));
    assert.equal(result.ok, true);
  }

  assert.equal(fakeDb.calls.length, categories.length);
});

test('writer output and repository result never grant identity case intake provider or AI side effects', async () => {
  const fakeDb = createFakeDbClient();
  const writer = createBrandReferralAuditContactWriter({ dbClient: fakeDb });
  const result = await writer.write(buildSafeIntent());
  const serialized = JSON.stringify({ result, calls: fakeDb.calls });

  [
    /identityVerified/i,
    /caseBound/i,
    /caseCreated/i,
    /repairIntakeCreated/i,
    /customerAccessGranted/i,
    /providerCalled/i,
    /webhookCalled/i,
    /aiCalled/i,
    /ragCalled/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(serialized, pattern);
  });
});
