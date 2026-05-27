'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
  ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS,
  buildEngineerMobileAssignedAppointmentDetailQuerySpec,
  buildEngineerMobileAssignedAppointmentListQuerySpec,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder');

const repoRoot = path.resolve(__dirname, '../..');
const builderFile = path.join(
  repoRoot,
  'src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js',
);

function listInput(overrides = {}) {
  return {
    engineerUserId: 'eng_task1758',
    filters: {
      dateRange: {
        from: '2026-05-27T00:00:00.000Z',
        to: '2026-05-28T00:00:00.000Z',
      },
      ignoredRawSql: 'DROP TABLE unsafe_task1758',
      internalNote: 'internal_note_should_not_leak',
      status: 'confirmed',
    },
    organizationId: 'org_task1758',
    ...overrides,
  };
}

function detailInput(overrides = {}) {
  return {
    appointmentId: 'apt_task1758',
    engineerUserId: 'eng_task1758',
    organizationId: 'org_task1758',
    ...overrides,
  };
}

function assertNoRawInterpolation(spec) {
  for (const value of [
    'org_task1758',
    'eng_task1758',
    'apt_task1758',
    '2026-05-27T00:00:00.000Z',
    '2026-05-28T00:00:00.000Z',
    'confirmed',
    'DROP TABLE unsafe_task1758',
    'internal_note_should_not_leak',
  ]) {
    assert.equal(spec.sql.includes(value), false, `SQL interpolated ${value}`);
  }
}

function assertNoForbiddenFieldLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'final_appointment_id',
    'raw_phone',
    'phone_number',
    'raw_address',
    'full_address',
    'internal_note',
    'internal_notes',
    'provider_debug',
    'provider_payload',
    'token',
    'secret',
    'password',
    'cookie',
    'authorization',
    'auth_header',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked forbidden field ${forbidden}`);
  }
}

function assertSelectOnlySql(sql) {
  assert.match(sql, /^SELECT\b/);

  for (const forbiddenVerb of [
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bUPSERT\b/i,
    /\bMERGE\b/i,
    /\bALTER\b/i,
    /\bDROP\b/i,
    /\bCREATE\b/i,
    /\bTRUNCATE\b/i,
  ]) {
    assert.doesNotMatch(sql, forbiddenVerb);
  }
}

function assertReadModelFirstSql(sql) {
  assert.match(sql, /FROM engineer_mobile_task_read_models em/);
  assert.match(sql, /em\.appointment_id AS appointment_id/);
  assert.match(sql, /em\.case_id AS case_reference/);
  assert.match(sql, /em\.customer_name_masked AS customer_display_name/);
  assert.match(sql, /em\.address_summary AS location_label/);
  assert.match(sql, /em\.site_note_safe AS public_customer_notes/);
  assert.match(sql, /em\.checklist_summary AS checklist_preview/);
  assert.doesNotMatch(sql, /FROM appointments\b/);
  assert.doesNotMatch(sql, /JOIN cases\b/);
  assert.doesNotMatch(sql, /\ba\.organization_id\b/);
  assert.doesNotMatch(sql, /\ba\.assigned_engineer_id\b/);
  assert.doesNotMatch(sql, /\bc\.case_reference\b/);
  assert.doesNotMatch(sql, /\bc\.customer_display_name\b/);
  assert.doesNotMatch(sql, /\bc\.location_label\b/);
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('exports assigned appointment query builder functions and safe fields', () => {
  assert.equal(typeof buildEngineerMobileAssignedAppointmentListQuerySpec, 'function');
  assert.equal(typeof buildEngineerMobileAssignedAppointmentDetailQuerySpec, 'function');
  assert.equal(ASSIGNED_APPOINTMENT_LIST_QUERY_NAME, 'engineerMobileAssignedAppointmentListReadOnlySql');
  assert.equal(ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME, 'engineerMobileAssignedAppointmentDetailReadOnlySql');
  assert.deepEqual(ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS, [
    'appointment_id',
    'case_reference',
    'appointment_window',
    'scheduled_start',
    'scheduled_end',
    'service_type',
    'customer_display_name',
    'location_label',
    'appointment_status',
    'priority_label',
    'service_summary',
    'public_customer_notes',
    'checklist_preview',
  ]);
});

test('list query requires organizationId and engineerUserId', () => {
  for (const queryInput of [
    {},
    { organizationId: 'org_task1758' },
    { engineerUserId: 'eng_task1758' },
  ]) {
    const spec = buildEngineerMobileAssignedAppointmentListQuerySpec(queryInput);

    assert.equal(spec.ok, false);
    assert.equal(spec.executable, false);
    assert.equal(spec.reason, 'missing_required_scope');
    assert.deepEqual(spec.requiredParams, ['organizationId', 'engineerUserId']);
    assert.equal(spec.sql, '');
    assert.deepEqual(spec.values, []);
  }
});

test('detail query requires organizationId engineerUserId and appointmentId', () => {
  for (const queryInput of [
    {},
    { organizationId: 'org_task1758', engineerUserId: 'eng_task1758' },
    { organizationId: 'org_task1758', appointmentId: 'apt_task1758' },
    { engineerUserId: 'eng_task1758', appointmentId: 'apt_task1758' },
  ]) {
    const spec = buildEngineerMobileAssignedAppointmentDetailQuerySpec(queryInput);

    assert.equal(spec.ok, false);
    assert.equal(spec.executable, false);
    assert.equal(spec.reason, 'missing_required_scope');
    assert.deepEqual(spec.requiredParams, ['organizationId', 'engineerUserId', 'appointmentId']);
    assert.equal(spec.sql, '');
    assert.deepEqual(spec.values, []);
  }
});

test('list query is SELECT-only and scoped by organization and engineer', () => {
  const spec = buildEngineerMobileAssignedAppointmentListQuerySpec(listInput());

  assert.equal(spec.ok, true);
  assert.equal(spec.executable, false);
  assert.deepEqual(spec.params, {
    engineerUserId: 'eng_task1758',
    from: '2026-05-27T00:00:00.000Z',
    organizationId: 'org_task1758',
    status: 'confirmed',
    to: '2026-05-28T00:00:00.000Z',
  });
  assert.deepEqual(spec.values, [
    'org_task1758',
    'eng_task1758',
    '2026-05-27T00:00:00.000Z',
    '2026-05-28T00:00:00.000Z',
    'confirmed',
  ]);
  assert.match(spec.sql, /em\.organization_id = \$1/);
  assert.match(spec.sql, /em\.assigned_engineer_id = \$2/);
  assert.match(spec.sql, /em\.scheduled_start >= \$3::timestamptz/);
  assert.match(spec.sql, /em\.scheduled_start <= \$4::timestamptz/);
  assert.match(spec.sql, /em\.status = \$5::text/);
  assertReadModelFirstSql(spec.sql);
  assertSelectOnlySql(spec.sql);
  assertNoRawInterpolation(spec);
  assertNoForbiddenFieldLeak(spec);
});

test('detail query is SELECT-only and scoped by organization engineer and appointment', () => {
  const spec = buildEngineerMobileAssignedAppointmentDetailQuerySpec(detailInput());

  assert.equal(spec.ok, true);
  assert.equal(spec.executable, false);
  assert.deepEqual(spec.params, {
    appointmentId: 'apt_task1758',
    engineerUserId: 'eng_task1758',
    organizationId: 'org_task1758',
  });
  assert.deepEqual(spec.values, [
    'org_task1758',
    'eng_task1758',
    'apt_task1758',
  ]);
  assert.match(spec.sql, /em\.organization_id = \$1/);
  assert.match(spec.sql, /em\.assigned_engineer_id = \$2/);
  assert.match(spec.sql, /em\.appointment_id = \$3/);
  assert.match(spec.sql, /LIMIT 1/);
  assertReadModelFirstSql(spec.sql);
  assertSelectOnlySql(spec.sql);
  assertNoRawInterpolation(spec);
  assertNoForbiddenFieldLeak(spec);
});

test('unsafe filters are ignored and cannot alter selected fields or predicates', () => {
  const spec = buildEngineerMobileAssignedAppointmentListQuerySpec(listInput({
    filters: {
      rawAddress: 'raw_address_should_not_leak',
      rawSql: 'SELECT * FROM unsafe_task1758',
      token: 'token_should_not_leak',
    },
  }));

  assert.equal(spec.ok, true);
  assert.deepEqual(spec.filters, {
    from: null,
    status: null,
    to: null,
  });
  assert.deepEqual(spec.values, [
    'org_task1758',
    'eng_task1758',
    null,
    null,
    null,
  ]);
  assertNoForbiddenFieldLeak(spec);
  assert.equal(JSON.stringify(spec).includes('unsafe_task1758'), false);
});

test('selected columns align with Task1748 projection normalizer fields', () => {
  const listSpec = buildEngineerMobileAssignedAppointmentListQuerySpec(listInput());
  const detailSpec = buildEngineerMobileAssignedAppointmentDetailQuerySpec(detailInput());

  for (const safeField of ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS) {
    assert.ok(listSpec.fields.includes(safeField));
    assert.ok(detailSpec.fields.includes(safeField));
    assert.match(listSpec.sql, new RegExp(`\\b${safeField}\\b`));
    assert.match(detailSpec.sql, new RegExp(`\\b${safeField}\\b`));
  }

  assertNoForbiddenFieldLeak(listSpec.fields);
  assertNoForbiddenFieldLeak(detailSpec.fields);
});

test('query specs are frozen deterministic objects and do not mutate input', () => {
  const source = listInput();
  const before = JSON.parse(JSON.stringify(source));
  const first = buildEngineerMobileAssignedAppointmentListQuerySpec(source);
  const second = buildEngineerMobileAssignedAppointmentListQuerySpec(source);

  assert.deepEqual(source, before);
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.fields), true);
  assert.equal(Object.isFrozen(first.values), true);
});

test('invalid appointment id fails closed without interpolation', () => {
  const spec = buildEngineerMobileAssignedAppointmentDetailQuerySpec(detailInput({
    appointmentId: 'apt unsafe interpolation',
  }));

  assert.equal(spec.ok, false);
  assert.equal(spec.sql, '');
  assert.deepEqual(spec.values, []);
});

test('source has no DB client import SQL execution app server route provider or mutation dependency', () => {
  const source = fs.readFileSync(builderFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /\b(?:dbClient|databaseClient|pool|queryExecutor|transaction)\b/);
  assert.doesNotMatch(source, /\.(?:query|execute|run)\s*\(/);
  assert.doesNotMatch(source, /\b(?:createServer|listen|registerRoute|router|app)\b/);
  assert.doesNotMatch(source, /\b(?:sendLine|sendSms|sendEmail|webhook|provider|openai|rag|vector)\b/i);
});
