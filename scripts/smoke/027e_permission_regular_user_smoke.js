#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { createSmokeMarker } = require('./helpers/smokeMarker');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_BASE_URL = (process.env.API_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const DATABASE_URL = process.env.DATABASE_URL;

const smokeMarker = createSmokeMarker({
  taskCode: 'Task027E',
  smokeName: 'smoke',
  runId: process.env.SMOKE_RUN_ID
});
const { smokeRunId, shortSmokeRunId, smokePrefix } = smokeMarker;
const roleKeySafeSmokeRunId = shortSmokeRunId.replace(/-/g, '_');
const prefix = `task027e-${smokeRunId}`;
const fixture = {
  roleKey: `task027e_limited_${roleKeySafeSmokeRunId}`,
  roleName: `Task 027E Limited Smoke Role ${smokeRunId}`,
  roleDescription: `${smokePrefix} limited regular user fixture role`,
  roleMetadata: {
    task: '027E',
    fixture: true,
    smokeRunId,
    smokePrefix
  },
  orgACode: `${prefix}-org-a`,
  orgBCode: `${prefix}-org-b`,
  orgAName: `Task 027E Organization A ${smokeRunId}`,
  orgBName: `Task 027E Organization B ${smokeRunId}`,
  dispatchUnitACode: `${prefix}-du-a`,
  dispatchUnitBCode: `${prefix}-du-b`,
  dispatchUnitAName: `Task 027E Dispatch Unit A ${smokeRunId}`,
  dispatchUnitBName: `Task 027E Dispatch Unit B ${smokeRunId}`,
  regularEmail: `task027e-regular-a-${shortSmokeRunId}@example.com`,
  disabledEmail: `task027e-disabled-${shortSmokeRunId}@example.com`,
  regularDisplayName: `Task027E Regular User ${smokeRunId}`,
  disabledDisplayName: `Task027E Disabled User ${smokeRunId}`,
  regularUpdatedDisplayName: `Task027E Regular User Updated ${smokeRunId}`,
  organizationMembershipNote: `${smokePrefix} regular user org A membership`
};

const state = {
  roleId: null,
  orgAId: null,
  orgBId: null,
  regularUserId: null,
  disabledUserId: null,
  dispatchUnitAId: null,
  dispatchUnitBId: null
};

const results = [];

function assertNoPasswordHash(label, payload) {
  const raw = JSON.stringify(payload);
  if (/password_hash|passwordHash/i.test(raw)) {
    throw new Error(`${label} leaked password hash field.`);
  }
}

function safeState() {
  const { regularPassword, ...safe } = state;
  return safe;
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

async function login(email, password) {
  const response = await api('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  if (!response.ok || !response.json?.data?.accessToken) {
    throw new Error(`Login failed for ${email}: HTTP ${response.status} ${JSON.stringify(response.json)}`);
  }

  assertNoPasswordHash(`login ${email}`, response.json);
  return response.json.data.accessToken;
}

async function ensureFixtureRole() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required to create the limited fixture role because no Role Admin API exists yet.');
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const roleResult = await client.query(
      `
        INSERT INTO roles (role_key, name, description, enabled, metadata)
        VALUES ($1, $2, $3, true, $4)
        RETURNING id, role_key
      `,
      [
        fixture.roleKey,
        fixture.roleName,
        fixture.roleDescription,
        fixture.roleMetadata
      ]
    );

    const role = roleResult.rows[0];
    const permissionKeys = ['audit_logs.read', 'notifications.read', 'dispatch_units.manage'];

    for (const permissionKey of permissionKeys) {
      const permission = await client.query(
        `
          SELECT id
          FROM permissions
          WHERE permission_key = $1
            AND enabled = true
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [permissionKey]
      );

      if (!permission.rows[0]) throw new Error(`Missing required permission fixture: ${permissionKey}`);

      await client.query(
        `
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [role.id, permission.rows[0].id]
      );
    }

    await client.query('COMMIT');
    state.roleId = role.id;
    return role;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  console.log('Task 027E smoke config', {
    taskCode: 'Task027E',
    smokeName: 'smoke',
    smokeRunId,
    apiBaseUrl: API_BASE_URL,
    adminEmail: ADMIN_EMAIL,
    hasDatabaseUrl: Boolean(DATABASE_URL)
  });

  let adminToken;
  let regularToken;

  await test('admin login', async () => {
    adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    return { tokenReceived: true };
  });

  await test('fixture limited role created through DATABASE_URL', async () => {
    const role = await ensureFixtureRole();
    return { roleId: role.id, roleKey: role.role_key };
  });

  await test('create organization A and B', async () => {
    const orgA = requireOk(await api('/api/v1/admin/organizations', {
      method: 'POST',
      token: adminToken,
      body: {
        organizationCode: fixture.orgACode,
        organizationName: fixture.orgAName,
        status: 'active'
      }
    }), 'create org A');

    const orgB = requireOk(await api('/api/v1/admin/organizations', {
      method: 'POST',
      token: adminToken,
      body: {
        organizationCode: fixture.orgBCode,
        organizationName: fixture.orgBName,
        status: 'active'
      }
    }), 'create org B');

    state.orgAId = orgA.id;
    state.orgBId = orgB.id;
    return { orgAId: state.orgAId, orgBId: state.orgBId };
  });

  await test('create dispatch unit A and B', async () => {
    const dispatchA = requireOk(await api('/api/v1/admin/dispatch-units', {
      method: 'POST',
      token: adminToken,
      body: {
        organizationId: state.orgAId,
        name: fixture.dispatchUnitAName,
        code: fixture.dispatchUnitACode,
        serviceRegion: 'north',
        status: 'active'
      }
    }), 'create dispatch unit A');

    const dispatchB = requireOk(await api('/api/v1/admin/dispatch-units', {
      method: 'POST',
      token: adminToken,
      body: {
        organizationId: state.orgBId,
        name: fixture.dispatchUnitBName,
        code: fixture.dispatchUnitBCode,
        serviceRegion: 'south',
        status: 'active'
      }
    }), 'create dispatch unit B');

    state.dispatchUnitAId = dispatchA.id;
    state.dispatchUnitBId = dispatchB.id;
    return { dispatchUnitAId: state.dispatchUnitAId, dispatchUnitBId: state.dispatchUnitBId };
  });

  await test('create regular user and verify no password hash in create response', async () => {
    const regularEmail = fixture.regularEmail;
    const response = await api('/api/v1/admin/users', {
      method: 'POST',
      token: adminToken,
      body: {
        email: regularEmail,
        password: 'Task027eRegular123!',
        displayName: fixture.regularDisplayName,
        status: 'active'
      }
    });

    const regularUser = requireOk(response, 'create regular user');
    assertNoPasswordHash('create regular user', response.json);
    state.regularUserId = regularUser.id;
    state.regularEmail = regularEmail;
    state.regularPassword = 'Task027eRegular123!';
    return { regularUserId: state.regularUserId, regularEmail };
  });

  await test('assign limited role and organization A membership', async () => {
    requireOk(await api(`/api/v1/admin/users/${state.regularUserId}/roles`, {
      method: 'POST',
      token: adminToken,
      body: { roleId: state.roleId }
    }), 'assign role');

    requireOk(await api(`/api/v1/admin/users/${state.regularUserId}/roles`, {
      method: 'POST',
      token: adminToken,
      body: { roleId: state.roleId }
    }), 'assign duplicate role');

    const roles = requireOk(await api(`/api/v1/admin/users/${state.regularUserId}/roles`, {
      token: adminToken
    }), 'list user roles');
    const activeFixtureRoles = roles.filter((role) => role.roleId === state.roleId);
    if (activeFixtureRoles.length !== 1) {
      throw new Error(`Expected one active fixture role assignment, got ${activeFixtureRoles.length}`);
    }

    requireOk(await api(`/api/v1/admin/users/${state.regularUserId}/organizations`, {
      method: 'POST',
      token: adminToken,
      body: {
        organizationId: state.orgAId,
        roleNote: fixture.organizationMembershipNote
      }
    }), 'assign organization A');

    return { roleId: state.roleId, organizationId: state.orgAId };
  });

  await test('regular user login', async () => {
    regularToken = await login(state.regularEmail, state.regularPassword);
    return { tokenReceived: true };
  });

  await test('regular user cannot read global audit logs', async () => {
    const response = await api('/api/v1/admin/audit-logs?limit=5', { token: regularToken });
    if (response.status !== 403) throw new Error(`Expected 403, got HTTP ${response.status}: ${JSON.stringify(response.json)}`);
    if (response.json?.data) throw new Error('Audit log data was returned to regular user.');
    return { status: response.status, code: response.json?.error?.code };
  });

  await test('regular user cannot read global notification APIs', async () => {
    const endpoints = [
      '/api/v1/admin/notification-preferences',
      '/api/v1/admin/notification-templates',
      '/api/v1/admin/notification-logs'
    ];
    const observed = [];

    for (const endpoint of endpoints) {
      const response = await api(endpoint, { token: regularToken });
      observed.push({ endpoint, status: response.status, code: response.json?.error?.code });
      if (response.status !== 403) throw new Error(`${endpoint} expected 403, got HTTP ${response.status}: ${JSON.stringify(response.json)}`);
      if (response.json?.data) throw new Error(`${endpoint} returned notification data to regular user.`);
    }

    return { endpoints: observed };
  });

  await test('regular user sees only own organization dispatch units', async () => {
    const allowedUnits = requireOk(await api(`/api/v1/admin/dispatch-units?organizationId=${state.orgAId}&limit=100`, {
      token: regularToken
    }), 'list organization A dispatch units');
    const allowedIds = allowedUnits.map((unit) => unit.id);

    if (!allowedIds.includes(state.dispatchUnitAId)) throw new Error('Organization A dispatch unit is not visible to organization A regular user.');
    if (allowedIds.includes(state.dispatchUnitBId)) throw new Error('Organization B dispatch unit leaked into organization A filtered list.');

    const scopedUnits = requireOk(await api('/api/v1/admin/dispatch-units?limit=100', {
      token: regularToken
    }), 'list scoped dispatch units');
    const scopedIds = scopedUnits.map((unit) => unit.id);
    if (scopedIds.includes(state.dispatchUnitBId)) throw new Error('Organization B dispatch unit leaked into unfiltered scoped list.');

    return { visibleAllowed: allowedIds.length, scopedCount: scopedIds.length };
  });

  await test('regular user cannot cross organization via dispatch unit endpoint', async () => {
    const listOtherResponse = await api(`/api/v1/admin/dispatch-units?organizationId=${state.orgBId}&limit=100`, {
      token: regularToken
    });
    if (![403, 404].includes(listOtherResponse.status)) {
      throw new Error(`Expected 403/404 for organization B list, got HTTP ${listOtherResponse.status}: ${JSON.stringify(listOtherResponse.json)}`);
    }

    const readOtherResponse = await api(`/api/v1/admin/dispatch-units/${state.dispatchUnitBId}`, {
      token: regularToken
    });
    if (![403, 404].includes(readOtherResponse.status)) {
      throw new Error(`Expected 403/404 for organization B read, got HTTP ${readOtherResponse.status}: ${JSON.stringify(readOtherResponse.json)}`);
    }

    return { listOtherStatus: listOtherResponse.status, readOtherStatus: readOtherResponse.status };
  });

  await test('disabled user cannot login and user responses hide password hash', async () => {
    const disabledEmail = fixture.disabledEmail;
    const disabledPassword = 'Task027eDisabled123!';
    const createDisabledResponse = await api('/api/v1/admin/users', {
      method: 'POST',
      token: adminToken,
      body: {
        email: disabledEmail,
        password: disabledPassword,
        displayName: fixture.disabledDisplayName,
        status: 'disabled'
      }
    });
    const disabledUser = requireOk(createDisabledResponse, 'create disabled user');
    assertNoPasswordHash('create disabled user', createDisabledResponse.json);
    state.disabledUserId = disabledUser.id;

    const getResponse = await api(`/api/v1/admin/users/${state.regularUserId}`, { token: adminToken });
    requireOk(getResponse, 'get regular user');
    assertNoPasswordHash('get regular user', getResponse.json);

    const listResponse = await api('/api/v1/admin/users?q=task027e&limit=100', { token: adminToken });
    requireOk(listResponse, 'list users');
    assertNoPasswordHash('list users', listResponse.json);

    const updateResponse = await api(`/api/v1/admin/users/${state.regularUserId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { displayName: fixture.regularUpdatedDisplayName }
    });
    requireOk(updateResponse, 'update regular user');
    assertNoPasswordHash('update regular user', updateResponse.json);

    const loginResponse = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: disabledEmail, password: disabledPassword }
    });
    if (![401, 403].includes(loginResponse.status)) {
      throw new Error(`Disabled user login expected 401/403, got HTTP ${loginResponse.status}: ${JSON.stringify(loginResponse.json)}`);
    }
    if (loginResponse.json?.data?.accessToken) throw new Error('Disabled user received an access token.');

    return { disabledUserId: state.disabledUserId, disabledLoginStatus: loginResponse.status };
  });

  const failures = results.filter((result) => result.status === 'FAIL');
  console.log('\nTask 027E smoke summary');
  console.log(JSON.stringify({ smokeRunId, state: safeState(), results }, null, 2));
  if (failures.length > 0) process.exit(1);
}

main().catch((error) => {
  fail('fatal', error);
  console.log(JSON.stringify({ smokeRunId, state: safeState(), results }, null, 2));
  process.exit(1);
});
