#!/usr/bin/env node

const API_BASE_URL = (process.env.API_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const { createSmokeMarker } = require('./helpers/smokeMarker');

const smokeMarker = createSmokeMarker({
  taskCode: 'Task047',
  smokeName: 'smoke',
  runId: process.env.SMOKE_RUN_ID
});
const { smokeRunId, shortSmokeRunId, smokePrefix } = smokeMarker;
const identitySuffix = `${Date.now()}${Math.random().toString(16).slice(2, 8)}`.replace(/[^a-zA-Z0-9]/g, '');
const fixture = {
  orgA: {
    code: `task047-org-a-${smokeRunId}`,
    name: `Task047 Organization A ${smokeRunId}`
  },
  orgB: {
    code: `task047-org-b-${smokeRunId}`,
    name: `Task047 Organization B ${smokeRunId}`
  },
  channelA: {
    code: `task047-line-a-${smokeRunId}`,
    name: `Task047 LINE Channel A ${smokeRunId}`,
    channelId: `task047-channel-a-${smokeRunId}`
  },
  channelB: {
    code: `task047-line-b-${smokeRunId}`,
    name: `Task047 LINE Channel B ${smokeRunId}`,
    channelId: `task047-channel-b-${smokeRunId}`
  },
  lineUserId: `Utask047test${identitySuffix}`,
  wrongLineUserId: `Utask047wrong${identitySuffix}`,
  crossLineUserId: `Utask047cross${identitySuffix}`,
  customerAName: `Task047 Test Customer A ${smokeRunId}`,
  customerBName: `Task047 Test Customer B ${smokeRunId}`,
  caseAModelNo: `T047-A-${shortSmokeRunId}`,
  caseBModelNo: `T047-B-${shortSmokeRunId}`,
  caseAProblemDescription: `${smokePrefix} LINE identity admin API smoke A`,
  caseBProblemDescription: `${smokePrefix} LINE identity admin API smoke B`,
  lineDisplayName: `Task047 LINE Fixture User ${smokeRunId}`
};

const state = {
  orgAId: null,
  orgBId: null,
  channelAId: null,
  channelBId: null,
  customerAId: null,
  customerBId: null,
  caseAId: null,
  caseANo: null,
  identityId: null
};

const results = [];

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
  'passwordHash',
  'lineUserId'
];

function mask(value) {
  if (!value) return null;
  if (value.length <= 8) return '***';
  return `${value.slice(0, 6)}***${value.slice(-4)}`;
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
    throw new Error(`${label} returned non-generic message: ${JSON.stringify(data)}`);
  }
}

async function createOrganization(token, org) {
  return requireOk(await api('/api/v1/admin/organizations', {
    method: 'POST',
    token,
    body: {
      organizationCode: org.code,
      organizationName: org.name,
      status: 'active'
    }
  }), `create ${org.code}`);
}

async function createLineChannel(token, organizationId, channel) {
  return requireOk(await api('/api/v1/admin/line-channels', {
    method: 'POST',
    token,
    body: {
      organizationId,
      channelCode: channel.code,
      channelName: channel.name,
      channelId: channel.channelId,
      channelSecret: 'task047-test-secret-only',
      channelAccessToken: 'task047-test-access-token-only',
      enabled: true
    }
  }), `create ${channel.code}`);
}

async function createCaseWithCustomer(token, organizationId, lineChannelId, marker) {
  const isCaseA = marker === 'A';
  const adminCase = requireOk(await api('/api/v1/admin/cases', {
    method: 'POST',
    token,
    body: {
      organizationId,
      customer: {
        customerName: isCaseA ? fixture.customerAName : fixture.customerBName,
        mobile: `090047${marker}${Date.now().toString().slice(-5)}`,
        city: 'Taipei',
        address: `Task047 Test Address ${marker}`,
        source: 'admin'
      },
      case: {
        source: 'line',
        brand: 'Task047 Brand',
        caseType: 'repair',
        productType: 'TV',
        modelNo: isCaseA ? fixture.caseAModelNo : fixture.caseBModelNo,
        problemDescription: isCaseA ? fixture.caseAProblemDescription : fixture.caseBProblemDescription,
        priority: 'normal',
        warrantyStatus: 'unknown',
        serviceRegion: 'north',
        intakeLineChannelId: lineChannelId
      }
    }
  }), `create case ${marker}`);

  return adminCase;
}

async function linkIdentity(token, customerId, lineChannelId, lineUserId = fixture.lineUserId) {
  return api(`/api/v1/admin/customers/${customerId}/line-identities`, {
    method: 'POST',
    token,
    body: {
      lineChannelId,
      lineUserId,
      displayName: fixture.lineDisplayName
    }
  });
}

async function listIdentities(token, customerId) {
  return api(`/api/v1/admin/customers/${customerId}/line-identities`, { token });
}

async function unlinkIdentity(token, customerId, identityId) {
  return api(`/api/v1/admin/customers/${customerId}/line-identities/${identityId}`, {
    method: 'DELETE',
    token
  });
}

async function lineInquiry(payload) {
  return api('/api/v1/public/line-case-inquiry', {
    method: 'POST',
    body: payload
  });
}

async function main() {
  console.log('Task 047 LINE identity admin API smoke config', {
    taskCode: 'Task047',
    smokeName: 'smoke',
    smokeRunId,
    apiBaseUrl: API_BASE_URL,
    adminEmail: ADMIN_EMAIL,
    lineUserIdMasked: mask(fixture.lineUserId)
  });

  let adminToken;

  await test('admin login', async () => {
    adminToken = await login();
    return { tokenReceived: true };
  });

  await test('create organizations and line channels', async () => {
    const orgA = await createOrganization(adminToken, fixture.orgA);
    const orgB = await createOrganization(adminToken, fixture.orgB);
    state.orgAId = orgA.id;
    state.orgBId = orgB.id;

    const channelA = await createLineChannel(adminToken, state.orgAId, fixture.channelA);
    const channelB = await createLineChannel(adminToken, state.orgBId, fixture.channelB);
    state.channelAId = channelA.id;
    state.channelBId = channelB.id;

    return { orgAId: state.orgAId, orgBId: state.orgBId, channelAId: state.channelAId, channelBId: state.channelBId };
  });

  await test('create two customers through case API', async () => {
    const caseA = await createCaseWithCustomer(adminToken, state.orgAId, state.channelAId, 'A');
    const caseB = await createCaseWithCustomer(adminToken, state.orgAId, state.channelAId, 'B');
    state.caseAId = caseA.id;
    state.caseANo = caseA.caseNo;
    state.customerAId = caseA.customerId;
    state.customerBId = caseB.customerId;
    return { caseAId: state.caseAId, caseANo: state.caseANo, customerAId: state.customerAId, customerBId: state.customerBId };
  });

  await test('admin can link customer LINE identity', async () => {
    const response = await linkIdentity(adminToken, state.customerAId, state.channelAId);
    const identity = requireOk(response, 'link identity');
    state.identityId = identity.id;

    assertNoInternalOnlyFields('link identity response', response.json);
    if (!identity.lineUserIdMasked) throw new Error('Expected lineUserIdMasked in response.');

    return { identityId: state.identityId, lineUserIdMasked: identity.lineUserIdMasked };
  });

  await test('list customer LINE identities returns masked data only', async () => {
    const response = await listIdentities(adminToken, state.customerAId);
    const identities = requireOk(response, 'list identities');

    assertNoInternalOnlyFields('list identities response', response.json);
    const found = identities.find((identity) => identity.id === state.identityId);
    if (!found) throw new Error('Linked identity was not returned in list response.');
    if (!found.lineUserIdMasked) throw new Error('Listed identity did not include masked lineUserId.');

    return { count: identities.length, identityId: found.id };
  });

  await test('duplicate link for same customer is idempotent', async () => {
    const response = await linkIdentity(adminToken, state.customerAId, state.channelAId);
    const identity = requireOk(response, 'duplicate link');

    if (identity.id !== state.identityId) {
      throw new Error(`Expected idempotent identity ${state.identityId}, got ${identity.id}`);
    }

    const listed = requireOk(await listIdentities(adminToken, state.customerAId), 'list after duplicate');
    const matches = listed.filter((item) => item.id === state.identityId);
    if (matches.length !== 1) throw new Error(`Expected exactly one active identity, got ${matches.length}`);

    return { identityId: identity.id, activeMatches: matches.length };
  });

  await test('same channel and lineUserId cannot link to another customer', async () => {
    const response = await linkIdentity(adminToken, state.customerBId, state.channelAId);
    if (response.status !== 409) {
      throw new Error(`Expected 409 conflict, got HTTP ${response.status}: ${JSON.stringify(response.json)}`);
    }
    return { status: response.status, code: response.json?.error?.code };
  });

  await test('cross-organization customer and line channel cannot link', async () => {
    const response = await linkIdentity(adminToken, state.customerAId, state.channelBId, fixture.crossLineUserId);
    if (![400, 403].includes(response.status)) {
      throw new Error(`Expected 400/403 for cross-organization link, got HTTP ${response.status}: ${JSON.stringify(response.json)}`);
    }
    return { status: response.status, code: response.json?.error?.code };
  });

  await test('public LINE inquiry success path uses admin-linked identity', async () => {
    const response = await lineInquiry({
      channelCode: fixture.channelA.code,
      caseNo: state.caseANo,
      lineUserId: fixture.lineUserId
    });

    if (!response.ok) {
      throw new Error(`success inquiry failed with HTTP ${response.status}: ${JSON.stringify(response.json)}`);
    }

    const data = response.json?.data;
    if (data?.verified !== true || !data.case) {
      throw new Error(`success inquiry did not verify: ${JSON.stringify(data)}`);
    }

    assertNoInternalOnlyFields('success inquiry response', response.json);

    return { verified: data.verified, caseNo: data.case.caseNo, customerVisibleStatus: data.case.customerVisibleStatus || null };
  });

  await test('public LINE inquiry failure paths remain generic', async () => {
    const wrongLineUser = await lineInquiry({
      channelCode: fixture.channelA.code,
      caseNo: state.caseANo,
      lineUserId: fixture.wrongLineUserId
    });
    assertGenericFailure(wrongLineUser, 'wrong lineUserId');

    const wrongChannel = await lineInquiry({
      channelCode: `${fixture.channelA.code}-wrong`,
      caseNo: state.caseANo,
      lineUserId: fixture.lineUserId
    });
    assertGenericFailure(wrongChannel, 'wrong channelCode');

    const wrongCase = await lineInquiry({
      channelCode: fixture.channelA.code,
      caseNo: `${state.caseANo}-wrong`,
      lineUserId: fixture.lineUserId
    });
    assertGenericFailure(wrongCase, 'wrong caseNo');

    return { wrongLineUser: wrongLineUser.status, wrongChannel: wrongChannel.status, wrongCase: wrongCase.status };
  });

  await test('unlink disables public LINE inquiry', async () => {
    const unlinkResponse = await unlinkIdentity(adminToken, state.customerAId, state.identityId);
    requireOk(unlinkResponse, 'unlink identity');
    assertNoInternalOnlyFields('unlink identity response', unlinkResponse.json);

    const response = await lineInquiry({
      channelCode: fixture.channelA.code,
      caseNo: state.caseANo,
      lineUserId: fixture.lineUserId
    });
    assertGenericFailure(response, 'inquiry after unlink');

    return { unlinkedIdentityId: state.identityId, inquiryStatus: response.status };
  });

  const failures = results.filter((result) => result.status === 'FAIL');
  console.log('\nTask 047 smoke summary');
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
