'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_QUERY_PARAM_ORDER_BY_NAME,
  createEngineerMobileQueryExecutorAdapter,
} = require('../../src/engineerMobile/engineerMobileQueryExecutorAdapter');

const repoRoot = path.resolve(__dirname, '../..');
const adapterFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileQueryExecutorAdapter.js');

function listSpec(overrides = {}) {
  return {
    executable: true,
    name: 'engineerMobileTaskListReadModel',
    ok: true,
    params: {
      engineerId: 'eng_query_adapter_001',
      from: '2026-05-21',
      organizationId: 'org_query_adapter_001',
      to: '2026-05-22',
    },
    sql: 'select safe_list_fields from engineer_mobile_task_list_read_model',
    ...overrides,
  };
}

function detailSpec(overrides = {}) {
  return {
    executable: true,
    name: 'engineerMobileTaskDetailReadModel',
    ok: true,
    params: {
      appointmentId: 'apt_query_adapter_001',
      engineerId: 'eng_query_adapter_001',
      organizationId: 'org_query_adapter_001',
    },
    sql: 'select safe_detail_fields from engineer_mobile_task_detail_read_model',
    ...overrides,
  };
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

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'raw_phone_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }
}

test('exports fixed parameter order for known Engineer Mobile read-model queries', () => {
  assert.deepEqual(ENGINEER_MOBILE_QUERY_PARAM_ORDER_BY_NAME.engineerMobileTaskListReadModel, [
    'organizationId',
    'engineerId',
    'from',
    'to',
  ]);
  assert.deepEqual(ENGINEER_MOBILE_QUERY_PARAM_ORDER_BY_NAME.engineerMobileTaskDetailReadModel, [
    'organizationId',
    'engineerId',
    'appointmentId',
  ]);
});

test('adapter executes list query through injected query client with fixed value order', async () => {
  const queryCalls = [];
  const executor = createEngineerMobileQueryExecutorAdapter({
    async query(sql, values) {
      queryCalls.push({ sql, values });
      return {
        rows: [
          {
            appointment_id: 'apt_query_adapter_001',
            case_id: 'case_query_adapter_001',
            organization_id: 'org_query_adapter_001',
          },
        ],
      };
    },
  });
  const result = await executor(listSpec());

  assert.deepEqual(queryCalls, [{
    sql: 'select safe_list_fields from engineer_mobile_task_list_read_model',
    values: [
      'org_query_adapter_001',
      'eng_query_adapter_001',
      '2026-05-21',
      '2026-05-22',
    ],
  }]);
  assert.deepEqual(result.rows, [{
    appointment_id: 'apt_query_adapter_001',
    case_id: 'case_query_adapter_001',
    organization_id: 'org_query_adapter_001',
  }]);
});

test('adapter executes detail query through function client with fixed value order', async () => {
  const queryCalls = [];
  const executor = createEngineerMobileQueryExecutorAdapter(async (sql, values) => {
    queryCalls.push({ sql, values });
    return {
      rows: [
        {
          appointment_id: 'apt_query_adapter_001',
          case_id: 'case_query_adapter_detail_001',
          organization_id: 'org_query_adapter_001',
        },
      ],
    };
  });
  const result = await executor(detailSpec());

  assert.deepEqual(queryCalls, [{
    sql: 'select safe_detail_fields from engineer_mobile_task_detail_read_model',
    values: [
      'org_query_adapter_001',
      'eng_query_adapter_001',
      'apt_query_adapter_001',
    ],
  }]);
  assert.deepEqual(result.rows, [{
    appointment_id: 'apt_query_adapter_001',
    case_id: 'case_query_adapter_detail_001',
    organization_id: 'org_query_adapter_001',
  }]);
});

test('adapter fail-closes for non executable malformed or unknown specs before query call', async () => {
  const queryCalls = [];
  const executor = createEngineerMobileQueryExecutorAdapter(async (sql, values) => {
    queryCalls.push({ sql, values });
    return { rows: [{ should_not: 'run' }] };
  });

  for (const spec of [
    null,
    {},
    listSpec({ executable: false }),
    listSpec({ ok: false }),
    listSpec({ name: 'unapprovedQueryName' }),
    listSpec({ sql: '' }),
    listSpec({ params: null }),
  ]) {
    assert.deepEqual(await executor(spec), { rows: [] });
  }

  assert.deepEqual(queryCalls, []);
});

test('adapter catches query failure without logging or leaking raw error', async () => {
  const originalConsoleError = console.error;
  const consoleCalls = [];
  console.error = (...args) => {
    consoleCalls.push(args);
  };

  try {
    const executor = createEngineerMobileQueryExecutorAdapter(async () => {
      throw new Error('raw_phone_should_not_leak token_should_not_leak');
    });
    const result = await executor(listSpec());

    assert.deepEqual(result, { rows: [] });
    assert.deepEqual(consoleCalls, []);
    assertNoForbiddenOutput(result);
  } finally {
    console.error = originalConsoleError;
  }
});

test('adapter clones rows and does not mutate the query spec or result rows', async () => {
  const sourceRows = [
    {
      appointment_id: 'apt_query_adapter_001',
      case_id: 'case_query_adapter_001',
      nested: { safe: true },
      organization_id: 'org_query_adapter_001',
    },
  ];
  const sourceSpec = listSpec();
  const snapshot = JSON.stringify(sourceSpec);
  const executor = createEngineerMobileQueryExecutorAdapter(async () => ({ rows: sourceRows }));
  const result = await executor(sourceSpec);

  result.rows[0].nested.safe = false;

  assert.equal(JSON.stringify(sourceSpec), snapshot);
  assert.equal(sourceRows[0].nested.safe, true);
});

test('source boundary imports no DB pool route app server notification provider AI or RAG modules', () => {
  const source = fs.readFileSync(adapterFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.equal(/console\.(log|warn|error)/.test(source), false);
  assert.equal(/require\(['"][^'"]*(db|pool|routes?|app|server|line|sms|email|push|openai|rag|vector)[^'"]*['"]\)/i.test(source), false);
});
