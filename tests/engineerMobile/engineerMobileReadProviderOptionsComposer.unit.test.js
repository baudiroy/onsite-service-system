'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  composeEngineerMobileReadProviderOptions,
} = require('../../src/engineerMobile/engineerMobileReadProviderOptionsComposer');

const repoRoot = path.resolve(__dirname, '../..');
const composerFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileReadProviderOptionsComposer.js');

function row(overrides = {}) {
  return {
    appointment_id: 'apt_composer_001',
    assigned_engineer_id: 'eng_composer_001',
    case_id: 'case_composer_001',
    organization_id: 'org_composer_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    appointment_status: 'confirmed',
    customer_name_masked: '王○○',
    customer_phone_masked: '09xx-xxx-123',
    address_summary: '台北市大安區',
    product_summary: '冷氣',
    issue_summary: '不冷',
    service_type: 'repair',
    internal_note: 'internal_note_should_not_leak',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    raw_phone: 'raw_phone_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'internal_note_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'raw_phone_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
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

test('non request-aware options are returned unchanged', () => {
  const options = {
    executor() {
      return { rows: [row()] };
    },
  };

  assert.equal(composeEngineerMobileReadProviderOptions(options), options);
});

test('explicit repository remains caller-owned', () => {
  const repository = {
    getReadModel() {
      return { tasks: [] };
    },
  };
  const options = composeEngineerMobileReadProviderOptions({
    executor() {
      return { rows: [row()] };
    },
    repository,
    useRequestAwareProvider: true,
  });

  assert.equal(options.repository, repository);
});

test('executor source is composed into async-capable read repository', async () => {
  const executorCalls = [];
  const options = composeEngineerMobileReadProviderOptions({
    allowNonExecutableForTest: true,
    async executor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [row()] };
    },
    useRequestAwareProvider: true,
  });

  assert.equal(typeof options.repository.getTaskListAsync, 'function');
  assert.equal(typeof options.repository.getTaskDetailAsync, 'function');

  const listResult = await options.repository.getTaskListAsync({
    engineerId: 'eng_composer_001',
    organizationId: 'org_composer_001',
  });
  const detailResult = await options.repository.getTaskDetailAsync({
    appointmentId: 'apt_composer_001',
    engineerId: 'eng_composer_001',
    organizationId: 'org_composer_001',
  });

  assert.equal(executorCalls.length, 2);
  assert.deepEqual(listResult.tasks.map((task) => task.caseId), ['case_composer_001']);
  assert.equal(detailResult.task.caseId, 'case_composer_001');
  assertNoForbiddenOutput([listResult, detailResult]);
});

test('queryExecutor alias is accepted when executor is absent', async () => {
  const options = composeEngineerMobileReadProviderOptions({
    allowNonExecutableForTest: true,
    queryExecutor() {
      return { rows: [row({ case_id: 'case_query_executor' })] };
    },
    useRequestAwareProvider: true,
  });
  const result = await options.repository.getTaskListAsync({
    engineerId: 'eng_composer_001',
    organizationId: 'org_composer_001',
  });

  assert.deepEqual(result.tasks.map((task) => task.caseId), ['case_query_executor']);
  assertNoForbiddenOutput(result);
});

test('module import boundary avoids DB pool routes app server notification and AI imports', () => {
  const source = fs.readFileSync(composerFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./engineerMobileReadRepository']);
  assert.equal(specifiers.some((specifier) => /db|pool|transaction|lineProvider|sms|email|push|openai|rag|vector|routes?|controllers?|app|server/i.test(specifier)), false);
});
