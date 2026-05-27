'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  SAFE_UNAVAILABLE_MESSAGE,
  createEngineerMobileAssignedAppointmentRepositoryGuard,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard');
const {
  getEngineerMobileAssignedAppointmentDetail,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler');
const {
  getEngineerMobileAssignedAppointments,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentsHandler');

const GUARD_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.js',
);

function unsafeFields() {
  return {
    authorization: 'authorization_should_not_pass',
    cookie: 'cookie_should_not_pass',
    debugPayload: 'debug_should_not_pass',
    finalAppointmentId: 'final_appointment_should_not_pass',
    internalNote: 'internal_note_should_not_pass',
    password: 'password_should_not_pass',
    rawRows: [{ id: 'row_should_not_pass' }],
    rawSql: 'raw_sql_should_not_pass',
    secret: 'secret_should_not_pass',
    token: 'token_should_not_pass',
    where: 'where_clause_should_not_pass',
  };
}

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_1750',
    engineerUserId: 'eng_user_1750',
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function appointmentRow(overrides = {}) {
  return {
    appointmentId: 'apt_1750_001',
    caseReference: 'CASE-1750-001',
    scheduledStart: '2026-06-02T01:00:00.000Z',
    scheduledEnd: '2026-06-02T03:00:00.000Z',
    appointmentWindow: '2026-06-02 09:00-11:00',
    serviceType: 'onsite',
    customerDisplayName: 'Guard customer masked',
    locationLabel: 'Taipei Zhongshan',
    status: 'confirmed',
    priorityLabel: 'normal',
    organizationId: 'org_engineer_mobile_1750',
    engineerUserId: 'eng_user_1750',
    finalAppointmentId: 'final_appointment_should_not_leak',
    rawSql: 'raw_sql_should_not_leak',
    token: 'token_should_not_leak',
    ...overrides,
  };
}

function delegateRepository(options = {}) {
  const calls = {
    list: [],
    detail: [],
    mutate: [],
  };
  const repository = {
    calls,
    async findAssignedAppointments(query) {
      calls.list.push(query);

      if (options.throwList) {
        throw new Error('raw_sql_should_not_leak stack_trace_should_not_leak token_should_not_leak');
      }

      return options.listResult || [appointmentRow()];
    },
    async findAssignedAppointmentDetail(query) {
      calls.detail.push(query);

      if (options.throwDetail) {
        throw new Error('raw_sql_should_not_leak stack_trace_should_not_leak token_should_not_leak');
      }

      return options.detailResult || appointmentRow({ appointmentId: query.appointmentId });
    },
    create() {
      calls.mutate.push('create');
      throw new Error('create should not be called');
    },
    update() {
      calls.mutate.push('update');
      throw new Error('update should not be called');
    },
    completeAppointment() {
      calls.mutate.push('completeAppointment');
      throw new Error('complete should not be called');
    },
  };

  if (options.withoutListMethod) {
    delete repository.findAssignedAppointments;
  }

  if (options.withoutDetailMethod) {
    delete repository.findAssignedAppointmentDetail;
  }

  return repository;
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'authorization_should_not_pass',
    'cookie_should_not_pass',
    'debug_should_not_pass',
    'final_appointment_should_not_pass',
    'final_appointment_should_not_leak',
    'internal_note_should_not_pass',
    'password_should_not_pass',
    'raw_sql_should_not_pass',
    'raw_sql_should_not_leak',
    'row_should_not_pass',
    'secret_should_not_pass',
    'stack_trace_should_not_leak',
    'token_should_not_pass',
    'token_should_not_leak',
    'where_clause_should_not_pass',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

async function assertRejectsSafely(promise) {
  await assert.rejects(
    promise,
    (error) => {
      assert.equal(error.message, SAFE_UNAVAILABLE_MESSAGE);
      assertNoForbiddenLeak({ message: error.message });
      return true;
    },
  );
}

test('guard exposes the expected read-only repository contract', () => {
  const guard = createEngineerMobileAssignedAppointmentRepositoryGuard({
    delegateRepository: delegateRepository(),
  });

  assert.equal(typeof guard.findAssignedAppointments, 'function');
  assert.equal(typeof guard.findAssignedAppointmentDetail, 'function');
  assert.deepEqual(Object.keys(guard).sort(), [
    'findAssignedAppointmentDetail',
    'findAssignedAppointments',
  ]);
});

test('valid list call delegates with only organization engineer and safe filters', async () => {
  const delegate = delegateRepository();
  const auditEvents = [];
  const guard = createEngineerMobileAssignedAppointmentRepositoryGuard({
    auditLogger: auditEvents.push.bind(auditEvents),
    delegateRepository: delegate,
  });

  const result = await guard.findAssignedAppointments({
    organizationId: 'org_engineer_mobile_1750',
    engineerUserId: 'eng_user_1750',
    filters: {
      from: '2026-06-02T00:00:00.000Z',
      to: '2026-06-02T23:59:59.999Z',
      status: 'confirmed',
      ...unsafeFields(),
    },
    ...unsafeFields(),
  });

  assert.equal(Array.isArray(result), true);
  assert.deepEqual(delegate.calls.list, [
    {
      organizationId: 'org_engineer_mobile_1750',
      engineerUserId: 'eng_user_1750',
      filters: {
        from: '2026-06-02T00:00:00.000Z',
        to: '2026-06-02T23:59:59.999Z',
        status: 'confirmed',
      },
    },
  ]);
  assert.deepEqual(delegate.calls.mutate, []);
  assert.deepEqual(auditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentRepositoryGuard.read',
      method: 'findAssignedAppointments',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1750',
      engineerUserId: 'eng_user_1750',
    },
  ]);
  assertNoForbiddenLeak(delegate.calls);
  assertNoForbiddenLeak(auditEvents);
});

test('valid detail call delegates with only organization engineer and appointment scope', async () => {
  const delegate = delegateRepository();
  const guard = createEngineerMobileAssignedAppointmentRepositoryGuard({
    delegateRepository: delegate,
  });

  const result = await guard.findAssignedAppointmentDetail({
    organizationId: 'org_engineer_mobile_1750',
    engineerUserId: 'eng_user_1750',
    appointmentId: 'apt_1750_001',
    ...unsafeFields(),
  });

  assert.equal(result.appointmentId, 'apt_1750_001');
  assert.deepEqual(delegate.calls.detail, [
    {
      organizationId: 'org_engineer_mobile_1750',
      engineerUserId: 'eng_user_1750',
      appointmentId: 'apt_1750_001',
    },
  ]);
  assert.deepEqual(delegate.calls.mutate, []);
  assertNoForbiddenLeak(delegate.calls);
});

test('missing scope fails closed before delegate access', async () => {
  for (const input of [
    { engineerUserId: 'eng_user_1750' },
    { organizationId: 'org_engineer_mobile_1750' },
    { organizationId: 'org_engineer_mobile_1750', engineerUserId: 'eng_user_1750' },
    {
      organizationId: 'org_engineer_mobile_1750',
      engineerUserId: 'eng_user_1750',
      appointmentId: '../unsafe',
    },
  ]) {
    const delegate = delegateRepository();
    const guard = createEngineerMobileAssignedAppointmentRepositoryGuard({
      delegateRepository: delegate,
    });

    if (input.appointmentId || input.organizationId && input.engineerUserId) {
      await assertRejectsSafely(guard.findAssignedAppointmentDetail(input));
    } else {
      await assertRejectsSafely(guard.findAssignedAppointments(input));
    }

    assert.deepEqual(delegate.calls.list, []);
    assert.deepEqual(delegate.calls.detail, []);
    assert.deepEqual(delegate.calls.mutate, []);
  }
});

test('missing delegate method fails closed', async () => {
  const listDelegate = delegateRepository({ withoutListMethod: true });
  const detailDelegate = delegateRepository({ withoutDetailMethod: true });
  const listGuard = createEngineerMobileAssignedAppointmentRepositoryGuard({
    delegateRepository: listDelegate,
  });
  const detailGuard = createEngineerMobileAssignedAppointmentRepositoryGuard({
    delegateRepository: detailDelegate,
  });

  await assertRejectsSafely(listGuard.findAssignedAppointments({
    organizationId: 'org_engineer_mobile_1750',
    engineerUserId: 'eng_user_1750',
  }));
  await assertRejectsSafely(detailGuard.findAssignedAppointmentDetail({
    organizationId: 'org_engineer_mobile_1750',
    engineerUserId: 'eng_user_1750',
    appointmentId: 'apt_1750_001',
  }));
  assert.deepEqual(listDelegate.calls.list, []);
  assert.deepEqual(detailDelegate.calls.detail, []);
});

test('delegate throw fails closed without raw error leak', async () => {
  const auditEvents = [];
  const delegate = delegateRepository({ throwList: true, throwDetail: true });
  const guard = createEngineerMobileAssignedAppointmentRepositoryGuard({
    auditLogger: { record: auditEvents.push.bind(auditEvents) },
    delegateRepository: delegate,
  });

  await assertRejectsSafely(guard.findAssignedAppointments({
    organizationId: 'org_engineer_mobile_1750',
    engineerUserId: 'eng_user_1750',
  }));
  await assertRejectsSafely(guard.findAssignedAppointmentDetail({
    organizationId: 'org_engineer_mobile_1750',
    engineerUserId: 'eng_user_1750',
    appointmentId: 'apt_1750_001',
  }));
  assertNoForbiddenLeak(auditEvents);
  assert.deepEqual(delegate.calls.mutate, []);
});

test('existing handlers can use guarded repository with synthetic delegate', async () => {
  const delegate = delegateRepository();
  const guard = createEngineerMobileAssignedAppointmentRepositoryGuard({
    delegateRepository: delegate,
  });
  const listResult = await getEngineerMobileAssignedAppointments({
    assignedAppointmentRepository: guard,
    context: engineerContext(),
    filters: {
      status: 'confirmed',
      ...unsafeFields(),
    },
  });
  const detailResult = await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository: guard,
    context: engineerContext(),
    input: {
      appointmentId: 'apt_1750_001',
      ...unsafeFields(),
    },
  });

  assert.equal(listResult.status, 'allow');
  assert.equal(detailResult.status, 'allow');
  assert.deepEqual(delegate.calls.list, [
    {
      organizationId: 'org_engineer_mobile_1750',
      engineerUserId: 'eng_user_1750',
      filters: {
        status: 'confirmed',
      },
    },
  ]);
  assert.deepEqual(delegate.calls.detail, [
    {
      organizationId: 'org_engineer_mobile_1750',
      engineerUserId: 'eng_user_1750',
      appointmentId: 'apt_1750_001',
    },
  ]);
  assert.deepEqual(delegate.calls.mutate, []);
  assertNoForbiddenLeak(listResult);
  assertNoForbiddenLeak(detailResult);
});

test('guard source has no DB app server route listen provider or mutation dependency', () => {
  const source = fs.readFileSync(GUARD_SOURCE, 'utf8');

  for (const forbidden of [
    'require(\'pg\')',
    'require("pg")',
    'dbClient',
    '.query(',
    'psql',
    'db:migrate',
    'createServer',
    'listen(',
    'registerRoute',
    'router.',
    'app.',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'INSERT ',
    'UPDATE ',
    'DELETE ',
    '.create(',
    '.update(',
    '.insert(',
    '.delete(',
    '.save(',
    '.complete(',
    '.publish(',
  ]) {
    assert.equal(source.includes(forbidden), false, `source contains ${forbidden}`);
  }
});
