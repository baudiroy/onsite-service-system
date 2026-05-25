'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DETAIL_SQL,
  ENGINEER_MOBILE_READ_MODEL_COLUMNS,
  ENGINEER_MOBILE_READ_MODEL_TABLE,
  LIST_SQL,
  createEngineerMobileReadModelRepository,
} = require('../../src/engineerMobile/engineerMobileReadModelRepository');
const {
  engineerMobileReadModelRows,
} = require('./fixtures/engineerMobileReadModelRows.fixture');

const repoRoot = path.resolve(__dirname, '../..');
const repositoryFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileReadModelRepository.js');

function request(overrides = {}) {
  return {
    appointmentId: 'apt_fixture_multi_visit_002',
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
    ...overrides,
  };
}

function listRequest(overrides = {}) {
  return {
    dateRange: {
      from: '2026-05-21T00:00:00.000Z',
      to: '2026-05-25T00:00:00.000Z',
    },
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
    ...overrides,
  };
}

function withUnsafeExtras(row = {}) {
  return {
    ...row,
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    audit_log: 'audit_log_should_not_leak',
    billing_internal: 'billing_internal_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    full_payload: 'full_payload_should_not_leak',
    internal_note: 'internal_note_should_not_leak',
    raw_address: 'raw_address_should_not_leak',
    raw_line_user_id: 'line_user_should_not_leak',
    raw_phone: 'raw_phone_should_not_leak',
    secret: 'secret_should_not_leak',
    settlement_internal: 'settlement_internal_should_not_leak',
    token: 'token_should_not_leak',
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'DATABASE_URL_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'audit_log_should_not_leak',
    'billing_internal_should_not_leak',
    'db timeout token secret raw_phone should not leak',
    'final_appointment_should_not_leak',
    'full_payload_should_not_leak',
    'internal_note_should_not_leak',
    'line_user_should_not_leak',
    'raw_address_should_not_leak',
    'raw_phone_should_not_leak',
    'secret_should_not_leak',
    'settlement_internal_should_not_leak',
    'token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  for (const forbiddenKey of [
    '"DATABASE_URL"',
    '"ai_raw_payload"',
    '"audit_log"',
    '"billing_internal"',
    '"finalAppointmentId"',
    '"final_appointment_id"',
    '"full_payload"',
    '"internal_note"',
    '"raw_address"',
    '"raw_line_user_id"',
    '"raw_phone"',
    '"secret"',
    '"settlement_internal"',
    '"token"',
  ]) {
    assert.equal(serialized.includes(forbiddenKey), false, `leaked key ${forbiddenKey}`);
  }
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

test('exports injected read-model repository factory and Migration 022 table metadata', () => {
  assert.equal(typeof createEngineerMobileReadModelRepository, 'function');
  assert.equal(ENGINEER_MOBILE_READ_MODEL_TABLE, 'engineer_mobile_task_read_models');
  assert.equal(LIST_SQL.includes('from engineer_mobile_task_read_models'), true);
  assert.equal(DETAIL_SQL.includes('from engineer_mobile_task_read_models'), true);
  assert.deepEqual(ENGINEER_MOBILE_READ_MODEL_COLUMNS, [
    'organization_id',
    'case_id',
    'appointment_id',
    'assigned_engineer_id',
    'scheduled_start',
    'scheduled_end',
    'status',
    'customer_name_masked',
    'customer_phone_masked',
    'address_summary',
    'product_summary',
    'issue_summary',
    'service_summary',
    'service_type',
    'site_note_safe',
    'checklist_summary',
    'evidence_refs',
  ]);
});

test('missing injected db client fails safely without querying', async () => {
  const repository = createEngineerMobileReadModelRepository();

  assert.deepEqual(await repository.getTaskList(listRequest()), { tasks: [] });
  assert.deepEqual(await repository.getTaskDetail(request()), { task: null });
});

test('list path reads through injected fake DB and returns mapper-approved fields only', async () => {
  const queryCalls = [];
  const repository = createEngineerMobileReadModelRepository({
    dbClient: {
      async query(sql, values) {
        queryCalls.push({ sql, values });

        return {
          rows: engineerMobileReadModelRows.map(withUnsafeExtras),
        };
      },
    },
  });

  const result = await repository.getTaskList(listRequest());

  assert.deepEqual(queryCalls, [{
    sql: LIST_SQL,
    values: [
      'org_fixture_engineer_mobile',
      'eng_fixture_primary',
      '2026-05-21T00:00:00.000Z',
      '2026-05-25T00:00:00.000Z',
    ],
  }]);
  assert.deepEqual(result.tasks.map((task) => task.appointmentId), [
    'apt_fixture_multi_visit_001',
    'apt_fixture_multi_visit_002',
    'apt_fixture_note_exclusion_001',
  ]);
  assertNoForbiddenOutput(result);
});

test('detail path reads through injected transaction and filters by organization engineer and appointment', async () => {
  const queryCalls = [];
  const repository = createEngineerMobileReadModelRepository({
    transaction: {
      async query(sql, values) {
        queryCalls.push({ sql, values });

        return {
          rows: [
            withUnsafeExtras(engineerMobileReadModelRows[0]),
            withUnsafeExtras(engineerMobileReadModelRows[1]),
            withUnsafeExtras({
              ...engineerMobileReadModelRows[1],
              appointment_id: 'apt_other',
              case_id: 'case_other',
            }),
          ],
        };
      },
    },
  });

  const result = await repository.getTaskDetail(request());

  assert.deepEqual(queryCalls, [{
    sql: DETAIL_SQL,
    values: [
      'org_fixture_engineer_mobile',
      'eng_fixture_primary',
      'apt_fixture_multi_visit_002',
    ],
  }]);
  assert.equal(result.task.appointmentId, 'apt_fixture_multi_visit_002');
  assert.equal(result.task.caseId, 'case_fixture_multi_visit_001');
  assertNoForbiddenOutput(result);
});

test('getReadModel dispatches list or detail based on appointmentId', async () => {
  const queryNames = [];
  const repository = createEngineerMobileReadModelRepository({
    async dbClient(sql) {
      queryNames.push(sql === DETAIL_SQL ? 'detail' : 'list');

      return {
        rows: engineerMobileReadModelRows.map(withUnsafeExtras),
      };
    },
  });

  const list = await repository.getReadModel(listRequest());
  const detail = await repository.getReadModel(request());

  assert.equal(list.tasks.length, 3);
  assert.equal(detail.task.appointmentId, 'apt_fixture_multi_visit_002');
  assert.deepEqual(queryNames, ['list', 'detail']);
  assertNoForbiddenOutput({ list, detail });
});

test('empty malformed and thrown DB results fail safely without sensitive leak', async () => {
  const malformedRepository = createEngineerMobileReadModelRepository({
    dbClient: {
      async query() {
        return {
          rows: [
            withUnsafeExtras({
              organization_id: 'org_fixture_engineer_mobile',
            }),
          ],
        };
      },
    },
  });
  const throwingRepository = createEngineerMobileReadModelRepository({
    dbClient: {
      async query() {
        throw new Error('db timeout token secret raw_phone should not leak');
      },
    },
  });

  assert.deepEqual(await malformedRepository.getTaskList(listRequest()), { tasks: [] });
  assert.deepEqual(await malformedRepository.getTaskDetail(request()), { task: null });
  assert.deepEqual(await throwingRepository.getTaskList(listRequest()), { tasks: [] });
  assert.deepEqual(await throwingRepository.getTaskDetail(request()), { task: null });
  assertNoForbiddenOutput([
    await malformedRepository.getTaskList(listRequest()),
    await malformedRepository.getTaskDetail(request()),
    await throwingRepository.getTaskList(listRequest()),
    await throwingRepository.getTaskDetail(request()),
  ]);
});

test('missing required scope fails safely before query call', async () => {
  const queryCalls = [];
  const repository = createEngineerMobileReadModelRepository({
    dbClient: {
      async query(sql, values) {
        queryCalls.push({ sql, values });
        return { rows: engineerMobileReadModelRows };
      },
    },
  });

  assert.deepEqual(await repository.getTaskList({ engineerId: 'eng_fixture_primary' }), { tasks: [] });
  assert.deepEqual(await repository.getTaskList({ organizationId: 'org_fixture_engineer_mobile' }), { tasks: [] });
  assert.deepEqual(await repository.getTaskDetail({
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
  }), { task: null });
  assert.deepEqual(queryCalls, []);
});

test('repository source imports only safe read-model mapper modules and no runtime sinks', () => {
  const source = fs.readFileSync(repositoryFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './engineerMobileTaskListReadModelMapper',
    './engineerMobileTaskDetailReadModelMapper',
  ]);

  [
    /process\.env/,
    /require\(['"].*(?:db|database|pool|config|server|app|router|controller|service|provider|webhook|sms|line|openai|rag|billing|entitlement)['"]\)/i,
    /app\.listen|server\.listen/,
    /fetch\(/,
    /axios|new Pool|Pool\(|createPool|getPool/i,
    /submitCompletion|createReport|updateReport|approveReport|publishReport|mutateFinalAppointmentId/i,
    /sendProviderMessage|dispatchPush|writeCorrection|brandChannelWebhook/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(source, pattern);
  });
});
