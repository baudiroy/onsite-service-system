'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  RepairIntakeDraftCaseApplicationServiceFactoryError,
  createRepairIntakeDraftCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftCaseApplicationServiceFactory');

const SOURCE_PATH = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftCaseApplicationServiceFactory.js',
);

function command(overrides = {}) {
  return {
    draftId: 'draft_task958_001',
    organizationId: 'org_task958',
    actorId: 'actor_task958',
    requestId: 'request_task958',
    idempotencyKey: 'idem_task958',
    approvalContext: {
      accepted: true,
      approvalId: 'approval_task958',
      acceptedByActorId: 'actor_task958',
    },
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: true,
      permissionSource: 'injected_task958_test',
    },
    ...overrides,
  };
}

function sanitizedDraft(overrides = {}) {
  return {
    draftId: 'draft_task958_001',
    organizationId: 'org_task958',
    brandId: 'brand_task958',
    serviceProviderId: 'provider_task958',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task958', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task958', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task958', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task958', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task958', type: 'issue_summary' },
    contactRoleSeparation: 'complete',
    platformAccepted: true,
    duplicateStatus: 'none',
    ...overrides,
  };
}

function createDbClient(calls = []) {
  return {
    findOne: async (tableName, where) => {
      calls.push({ method: 'findOne', tableName, where });
      return null;
    },
    transaction: async (callback) => {
      calls.push({ method: 'transaction' });

      return callback({
        insert: async (tableName, payload) => {
          calls.push({ method: 'tx.insert', tableName, payload });
          return { ok: true, rows: [{ phone: 'phone', token: 'token' }] };
        },
        update: async (tableName, payload, where) => {
          calls.push({ method: 'tx.update', tableName, payload, where });
          return { ok: true, rows: [{ address: 'address', secret: 'secret' }] };
        },
      });
    },
    query: async (sqlText, values) => {
      calls.push({ method: 'query', sqlText, values });
      return { rows: [] };
    },
    insert: async (tableName, payload) => {
      calls.push({ method: 'insert', tableName, payload });
      return { ok: true };
    },
    update: async (tableName, payload, where) => {
      calls.push({ method: 'update', tableName, payload, where });
      return { ok: true };
    },
  };
}

function createIdGenerator() {
  const ids = ['case_task958_001', 'audit_task958_001'];

  return () => ids.shift() || 'generated_task958_extra';
}

function assertFactoryError(error, reasonCode) {
  assert.equal(error instanceof RepairIntakeDraftCaseApplicationServiceFactoryError, true);
  assert.equal(error.reasonCode, reasonCode);
  assert.equal(error.message, reasonCode);
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'caseId',
    'case_id',
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawImportedRowPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'rows',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function createDraftReader(calls = []) {
  return async (input) => {
    calls.push(input);

    return sanitizedDraft();
  };
}

test('happy path factory returns submitDraftToCase and planDraftToCase functions', () => {
  const dbCalls = [];
  const readerCalls = [];
  const service = createRepairIntakeDraftCaseApplicationService({
    dbClient: createDbClient(dbCalls),
    idGenerator: createIdGenerator(),
    draftReader: createDraftReader(readerCalls),
  });

  assert.equal(typeof service.submitDraftToCase, 'function');
  assert.equal(typeof service.planDraftToCase, 'function');
  assert.deepEqual(dbCalls, []);
  assert.deepEqual(readerCalls, []);
});

test('missing dbClient fails safely', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseApplicationService({
      idGenerator: createIdGenerator(),
      draftReader: createDraftReader(),
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_APPLICATION_SERVICE_DB_CLIENT_REQUIRED',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('missing idGenerator fails safely', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseApplicationService({
      dbClient: createDbClient(),
      draftReader: createDraftReader(),
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_APPLICATION_SERVICE_ID_GENERATOR_REQUIRED',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('missing draftReader fails safely', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseApplicationService({
      dbClient: createDbClient(),
      idGenerator: createIdGenerator(),
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_APPLICATION_SERVICE_DRAFT_READER_REQUIRED',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('factory creation does not call DB methods or draftReader', () => {
  const dbCalls = [];
  const readerCalls = [];
  const idCalls = [];

  createRepairIntakeDraftCaseApplicationService({
    dbClient: createDbClient(dbCalls),
    idGenerator: () => {
      idCalls.push('called');
      return 'generated_task958';
    },
    draftReader: createDraftReader(readerCalls),
  });

  assert.deepEqual(dbCalls, []);
  assert.deepEqual(readerCalls, []);
  assert.deepEqual(idCalls, []);
});

test('planDraftToCase uses injected draftReader with sanitized input', async () => {
  const readerCalls = [];
  const service = createRepairIntakeDraftCaseApplicationService({
    dbClient: createDbClient(),
    idGenerator: createIdGenerator(),
    draftReader: createDraftReader(readerCalls),
  });

  const result = await service.planDraftToCase({
    ...command(),
    phone: '+886900000000',
    fullAddress: 'unsafe full address',
    customerPayload: { raw: true },
    finalAppointmentId: 'final_task958',
  });

  assert.deepEqual(readerCalls, [{
    draftId: 'draft_task958_001',
    organizationId: 'org_task958',
    actorId: 'actor_task958',
    requestId: 'request_task958',
  }]);
  assert.equal(result.ok, true);
  assert.equal(result.caseCreationAllowed, true);
  assert.equal(result.candidateReady, true);
  assert.equal(result.caseCandidate.sourceDraftId, 'draft_task958_001');
  assertNoForbiddenFields(result);
});

test('submitDraftToCase uses composed planner idempotency checker and caseCreator', async () => {
  const dbCalls = [];
  const readerCalls = [];
  const service = createRepairIntakeDraftCaseApplicationService({
    dbClient: createDbClient(dbCalls),
    idGenerator: createIdGenerator(),
    draftReader: createDraftReader(readerCalls),
    clock: () => '2026-05-23T12:00:00.000Z',
  });

  const result = await service.submitDraftToCase(command());

  assert.equal(result.ok, true);
  assert.equal(result.action, 'repair_intake_draft_to_case_submit');
  assert.equal(result.draftId, 'draft_task958_001');
  assert.equal(result.organizationId, 'org_task958');
  assert.equal(result.submitted, true);
  assert.equal(result.caseCreationAllowed, true);
  assert.equal(result.candidateReady, true);
  assert.equal(result.reasonCode, 'CASE_SUBMITTED');
  assert.deepEqual(result.requiredActions, []);
  assert.deepEqual(result.caseRef, {
    id: 'case_task958_001',
    organizationId: 'org_task958',
    sourceDraftId: 'draft_task958_001',
    status: 'created',
  });
  assert.equal(result.auditEvent.eventType, 'repair_intake_draft_to_case_submission');
  assert.equal(result.auditEvent.outcome, 'submitted');
  assert.deepEqual(readerCalls, [{
    draftId: 'draft_task958_001',
    organizationId: 'org_task958',
    actorId: 'actor_task958',
    requestId: 'request_task958',
  }]);
  assert.deepEqual(dbCalls.map((call) => call.method), [
    'findOne',
    'transaction',
    'tx.insert',
    'tx.update',
    'tx.insert',
  ]);
  assert.equal(dbCalls[0].tableName, 'repair_intake_draft_case_submissions');
  assert.equal(dbCalls[2].tableName, 'cases');
  assert.equal(dbCalls[3].tableName, 'repair_intake_drafts');
  assert.equal(dbCalls[4].tableName, 'audit_events');
  assertNoForbiddenFields(result);
});

test('unsafe raw options are rejected and not returned', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseApplicationService({
      dbClient: createDbClient(),
      idGenerator: createIdGenerator(),
      draftReader: createDraftReader(),
      phone: '+886900000000',
      rawCustomerPayload: { name: 'unsafe customer' },
      providerPayload: { token: 'unsafe token' },
      finalAppointmentId: 'final_task958',
    }),
    (error) => {
      assertFactoryError(
        error,
        'REPAIR_INTAKE_DRAFT_CASE_APPLICATION_SERVICE_UNSAFE_INPUT',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('source imports only accepted local runtime composition modules', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const specifiers = [];
  const requirePattern = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = requirePattern.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  assert.deepEqual(specifiers.sort(), [
    './repairIntakeDraftCasePlanningService',
    './repairIntakeDraftCaseRuntimeDependencyFactory',
    './repairIntakeDraftCaseSubmissionService',
  ].sort());

  for (const forbidden of [
    '../app',
    '../server',
    '../routes',
    '../controllers',
    '../providers',
    '../ai',
    '../admin',
    '../billing',
    '../smoke',
    '../migrations',
    '../db',
    'process.env',
    'pg',
    'knex',
    'sequelize',
  ]) {
    assert.equal(source.includes(forbidden), false, `source imports forbidden runtime ${forbidden}`);
  }
});
