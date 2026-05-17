#!/usr/bin/env node

const { Pool } = require('pg');
const { createSmokeMarker } = require('./helpers/smokeMarker');

const API_BASE_URL = (process.env.API_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const DATABASE_URL = process.env.DATABASE_URL;
const USE_DB_LINE_IDENTITY_FIXTURE = process.env.USE_DB_LINE_IDENTITY_FIXTURE === '1';

const smokeMarker = createSmokeMarker({
  taskCode: 'Task046',
  smokeName: 'smoke',
  runId: process.env.SMOKE_RUN_ID
});
const { smokeRunId, shortSmokeRunId, smokePrefix } = smokeMarker;
const identitySuffix = `${Date.now()}${Math.random().toString(16).slice(2, 8)}`;
const fixture = {
  organizationCode: `task046-smoke-org-${smokeRunId}`,
  organizationName: `Task046 LINE Inquiry Fixture Organization ${smokeRunId}`,
  channelCode: `task046-line-channel-${smokeRunId}`,
  channelName: `Task046 LINE Inquiry Test Channel ${smokeRunId}`,
  channelId: `task046-channel-${smokeRunId}`,
  lineUserId: `Utask046test${identitySuffix.replace(/[^a-zA-Z0-9]/g, '')}`,
  wrongLineUserId: `Utask046wrong${identitySuffix.replace(/[^a-zA-Z0-9]/g, '')}`,
  customerName: `Task046 Test Customer ${smokeRunId}`,
  customerMobile: `090046${Date.now().toString().slice(-6)}`,
  city: 'Taipei',
  address: 'Task046 Test Address',
  brand: 'Task046 Brand',
  productType: 'TV',
  modelNo: `T046-${shortSmokeRunId}`,
  problemDescription: `${smokePrefix} LINE inquiry fixture case`,
  lineDisplayName: `Task046 LINE Fixture User ${smokeRunId}`
};

const results = [];
const state = {
  organizationId: null,
  lineChannelId: null,
  customerId: null,
  caseId: null,
  caseNo: null,
  identityId: null
};

const INTERNAL_ONLY_KEYS = [
  'internalNote',
  'internalNotes',
  'auditLogs',
  'audit_logs',
  'aiRawOutput',
  'ocrRawOutput',
  'dispatchRules',
  'engineerNotes',
  'billing',
  'billingData',
  'permissions',
  'channelSecret',
  'channel_secret',
  'channelAccessToken',
  'channel_access_token',
  'accessToken',
  'token',
  'secret',
  'password',
  'password_hash',
  'passwordHash'
];

function mask(value) {
  if (!value) return null;
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function pass(name, details = {}) {
  results.push({ name, status: 'PASS', details });
  console.log(`PASS ${name}`, details);
}

function fail(name, error, details = {}) {
  const message = error instanceof Error ? error.message : String(error);
  results.push({ name, status: 'FAIL', error: message, details });
  console.error(`FAIL ${name}`, { error: message, ...details });
}

async function test(name, fn) {
  try {
    const details = await fn();
    pass(name, details);
  } catch (error) {
    fail(name, error);
  }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, ok: res.ok, json };
}

function requireOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}: ${JSON.stringify(response.json)}`);
  }

  return response.json?.data;
}

async function login() {
  const response = await api('/api/v1/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });

  if (!response.ok || !response.json?.data?.accessToken) {
    throw new Error(`Admin login failed: HTTP ${response.status} ${JSON.stringify(response.json)}`);
  }

  return response.json.data.accessToken;
}

function findInternalKeys(value, path = 'response', found = []) {
  if (!value || typeof value !== 'object') return found;

  if (Array.isArray(value)) {
    value.forEach((item, index) => findInternalKeys(item, `${path}[${index}]`, found));
    return found;
  }

  for (const key of Object.keys(value)) {
    const nextPath = `${path}.${key}`;
    if (INTERNAL_ONLY_KEYS.includes(key)) {
      found.push(nextPath);
      continue;
    }
    findInternalKeys(value[key], nextPath, found);
  }

  return found;
}

function assertNoInternalOnlyFields(label, payload) {
  const found = findInternalKeys(payload);
  if (found.length > 0) {
    throw new Error(`${label} leaked internal-only keys: ${found.join(', ')}`);
  }
}

function assertGenericFailure(response, label) {
  if (!response.ok) {
    throw new Error(`${label} expected generic success envelope, got HTTP ${response.status}: ${JSON.stringify(response.json)}`);
  }

  const data = response.json?.data;
  if (data?.verified !== false) {
    throw new Error(`${label} expected verified=false, got ${JSON.stringify(data)}`);
  }

  if (data.message !== 'Unable to verify the case with the provided information.') {
    throw new Error(`${label} returned a non-generic failure message: ${JSON.stringify(data)}`);
  }
}

async function createOrganization(token) {
  const organization = requireOk(await api('/api/v1/admin/organizations', {
    method: 'POST',
    token,
    body: {
      organizationCode: fixture.organizationCode,
      organizationName: fixture.organizationName,
      status: 'active'
    }
  }), 'create organization');

  state.organizationId = organization.id;
  return { organizationId: state.organizationId, organizationCode: organization.organizationCode };
}

async function createLineChannel(token) {
  const channel = requireOk(await api('/api/v1/admin/line-channels', {
    method: 'POST',
    token,
    body: {
      organizationId: state.organizationId,
      channelCode: fixture.channelCode,
      channelName: fixture.channelName,
      channelId: fixture.channelId,
      channelSecret: 'task046-test-secret-only',
      channelAccessToken: 'task046-test-access-token-only',
      enabled: true
    }
  }), 'create line channel');

  state.lineChannelId = channel.id;
  return { lineChannelId: state.lineChannelId, channelCode: channel.channelCode };
}

async function createCase(token) {
  const adminCase = requireOk(await api('/api/v1/admin/cases', {
    method: 'POST',
    token,
    body: {
      organizationId: state.organizationId,
      customer: {
        customerName: fixture.customerName,
        mobile: fixture.customerMobile,
        city: fixture.city,
        address: fixture.address,
        source: 'admin'
      },
      case: {
        source: 'line',
        brand: fixture.brand,
        caseType: 'repair',
        productType: fixture.productType,
        modelNo: fixture.modelNo,
        problemDescription: fixture.problemDescription,
        priority: 'normal',
        warrantyStatus: 'unknown',
        serviceRegion: 'north',
        intakeLineChannelId: state.lineChannelId
      }
    }
  }), 'create case');

  state.caseId = adminCase.id;
  state.caseNo = adminCase.caseNo;
  state.customerId = adminCase.customerId;
  return { caseId: state.caseId, caseNo: state.caseNo, customerId: state.customerId };
}

async function createCustomerLineIdentityWithDbFallback() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required because there is no admin customer_line_identity fixture API.');
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
        INSERT INTO customer_line_identities (
          customer_id,
          organization_id,
          line_channel_id,
          line_user_id,
          display_name,
          linked_at
        )
        VALUES ($1, $2, $3, $4, $5, now())
        RETURNING id
      `,
      [
        state.customerId,
        state.organizationId,
        state.lineChannelId,
        fixture.lineUserId,
        fixture.lineDisplayName
      ]
    );

    state.identityId = result.rows[0].id;
    return { identityId: state.identityId, lineUserIdMasked: mask(fixture.lineUserId) };
  } finally {
    client.release();
    await pool.end();
  }
}

async function linkCustomerLineIdentity(token) {
  if (USE_DB_LINE_IDENTITY_FIXTURE) {
    return createCustomerLineIdentityWithDbFallback();
  }

  const identity = requireOk(await api(`/api/v1/admin/customers/${state.customerId}/line-identities`, {
    method: 'POST',
    token,
    body: {
      lineChannelId: state.lineChannelId,
      lineUserId: fixture.lineUserId,
      displayName: fixture.lineDisplayName
    }
  }), 'link customer LINE identity');

  state.identityId = identity.id;

  if (identity.lineUserId) {
    throw new Error('LINE identity link response leaked raw lineUserId.');
  }

  return {
    identityId: state.identityId,
    lineUserIdMasked: identity.lineUserIdMasked || null,
    mode: 'admin_api'
  };
}

async function lineInquiry(payload) {
  return api('/api/v1/public/line-case-inquiry', {
    method: 'POST',
    body: payload
  });
}

async function main() {
  console.log('Task 046 LINE inquiry fixture smoke config', {
    taskCode: 'Task046',
    smokeName: 'smoke',
    smokeRunId,
    apiBaseUrl: API_BASE_URL,
    adminEmail: ADMIN_EMAIL,
    hasDatabaseUrl: Boolean(DATABASE_URL),
    useDbLineIdentityFixture: USE_DB_LINE_IDENTITY_FIXTURE,
    channelCode: fixture.channelCode,
    lineUserIdMasked: mask(fixture.lineUserId)
  });

  let adminToken;

  await test('admin login', async () => {
    adminToken = await login();
    return { tokenReceived: true };
  });

  await test('create task046 organization', async () => createOrganization(adminToken));
  await test('create task046 line channel', async () => createLineChannel(adminToken));
  await test('create task046 customer and case', async () => createCase(adminToken));
  await test('link customer LINE identity through Admin API', async () => linkCustomerLineIdentity(adminToken));

  await test('public LINE inquiry success path returns customer-visible data only', async () => {
    const response = await lineInquiry({
      channelCode: fixture.channelCode,
      caseNo: state.caseNo,
      lineUserId: fixture.lineUserId
    });

    if (!response.ok) {
      throw new Error(`success inquiry failed with HTTP ${response.status}: ${JSON.stringify(response.json)}`);
    }

    const data = response.json?.data;
    if (data?.verified !== true || !data.case) {
      throw new Error(`success inquiry did not verify: ${JSON.stringify(data)}`);
    }

    if (data.case.caseNo !== state.caseNo) {
      throw new Error(`success inquiry returned unexpected caseNo: ${data.case.caseNo}`);
    }

    assertNoInternalOnlyFields('success inquiry response', response.json);

    return {
      verified: data.verified,
      caseNo: data.case.caseNo,
      customerVisibleStatus: data.case.customerVisibleStatus || null
    };
  });

  await test('public LINE inquiry wrong lineUserId returns generic failure', async () => {
    const response = await lineInquiry({
      channelCode: fixture.channelCode,
      caseNo: state.caseNo,
      lineUserId: fixture.wrongLineUserId
    });

    assertGenericFailure(response, 'wrong lineUserId inquiry');
    assertNoInternalOnlyFields('wrong lineUserId inquiry response', response.json);

    return { verified: response.json.data.verified, message: response.json.data.message };
  });

  await test('public LINE inquiry wrong channelCode returns generic failure', async () => {
    const response = await lineInquiry({
      channelCode: `${fixture.channelCode}-wrong`,
      caseNo: state.caseNo,
      lineUserId: fixture.lineUserId
    });

    assertGenericFailure(response, 'wrong channelCode inquiry');
    assertNoInternalOnlyFields('wrong channelCode inquiry response', response.json);

    return { verified: response.json.data.verified, message: response.json.data.message };
  });

  await test('public LINE inquiry wrong caseNo returns generic failure', async () => {
    const response = await lineInquiry({
      channelCode: fixture.channelCode,
      caseNo: `${state.caseNo}-wrong`,
      lineUserId: fixture.lineUserId
    });

    assertGenericFailure(response, 'wrong caseNo inquiry');
    assertNoInternalOnlyFields('wrong caseNo inquiry response', response.json);

    return { verified: response.json.data.verified, message: response.json.data.message };
  });

  const failures = results.filter((result) => result.status === 'FAIL');
  console.log('\nTask 046 smoke summary');
  console.log(JSON.stringify({
    smokeRunId,
    state: {
      ...state,
      lineUserIdMasked: mask(fixture.lineUserId)
    },
    results
  }, null, 2));

  if (failures.length > 0) process.exit(1);
}

main().catch((error) => {
  fail('fatal', error);
  console.log(JSON.stringify({
    smokeRunId,
    state: {
      ...state,
      lineUserIdMasked: mask(fixture.lineUserId)
    },
    results
  }, null, 2));
  process.exit(1);
});
