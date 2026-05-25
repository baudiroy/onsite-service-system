const assert = require('node:assert/strict');
const test = require('node:test');

const {
  EngineerMobileWorkbenchAuthSessionBoundary
} = require('../../src/auth/EngineerMobileWorkbenchAuthSessionBoundary');
const {
  EngineerMobileWorkbenchCompletionSubmissionBoundary
} = require('../../src/boundaries/EngineerMobileWorkbenchCompletionSubmissionBoundary');
const {
  EngineerMobileWorkbenchController
} = require('../../src/controllers/EngineerMobileWorkbenchController');
const {
  EngineerMobileWorkbenchCompletionSubmissionValidator
} = require('../../src/validators/EngineerMobileWorkbenchCompletionSubmissionValidator');
const {
  EngineerMobileWorkbenchPermissionGuard
} = require('../../src/guards/EngineerMobileWorkbenchPermissionGuard');
const {
  EngineerMobileWorkbenchProjection
} = require('../../src/projections/EngineerMobileWorkbenchProjection');
const {
  EngineerMobileWorkbenchResolver
} = require('../../src/resolvers/EngineerMobileWorkbenchResolver');
const {
  syntheticEngineerContext,
  syntheticForbiddenPayloadMarkers,
  syntheticTaskReference
} = require('../../fixtures/engineerMobileWorkbench/syntheticEngineerMobileWorkbench.fixture');

const EXPECTED_NOT_IMPLEMENTED_CODE = 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED';

const buildResponse = () => {
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  return response;
};

const assertNoSensitiveSkeletonPayload = (payload) => {
  const serialized = JSON.stringify(payload);

  assert.equal(serialized.includes('customer'), false);
  assert.equal(serialized.includes('case'), false);
  assert.equal(serialized.includes('appointment'), false);
  assert.equal(serialized.includes('finalAppointmentId'), false);
  assert.equal(serialized.includes('raw-channel-id'), false);
  assert.equal(serialized.includes('provider-payload'), false);
};

test('Engineer Mobile Workbench skeleton modules exist', () => {
  assert.equal(typeof EngineerMobileWorkbenchController, 'function');
  assert.equal(typeof EngineerMobileWorkbenchResolver, 'function');
  assert.equal(typeof EngineerMobileWorkbenchPermissionGuard, 'function');
  assert.equal(typeof EngineerMobileWorkbenchProjection, 'function');
  assert.equal(typeof EngineerMobileWorkbenchAuthSessionBoundary, 'function');
  assert.equal(typeof EngineerMobileWorkbenchCompletionSubmissionBoundary, 'function');
  assert.equal(typeof EngineerMobileWorkbenchCompletionSubmissionValidator, 'function');
});

test('synthetic fixture remains clearly synthetic', () => {
  assert.equal(syntheticEngineerContext.organizationRef, 'synthetic-org-001');
  assert.equal(syntheticEngineerContext.engineerRef, 'synthetic-engineer-001');
  assert.equal(syntheticTaskReference.appointmentRef, 'synthetic-appointment-001');
  assert.equal(Array.isArray(syntheticForbiddenPayloadMarkers), true);
  assert.equal(
    syntheticForbiddenPayloadMarkers.includes('manual-final-appointment-selection'),
    true
  );
});

test('resolver methods return not implemented skeleton result', async () => {
  const resolver = new EngineerMobileWorkbenchResolver();
  const methods = [
    'getCurrentContext',
    'listTasks',
    'getTaskDetail',
    'markArrived',
    'markStarted',
    'submitCompletion'
  ];

  for (const method of methods) {
    const result = await resolver[method]();

    assert.equal(result.statusCode, 501);
    assert.equal(result.error.code, EXPECTED_NOT_IMPLEMENTED_CODE);
    assertNoSensitiveSkeletonPayload(result);
  }
});

test('controller methods respond with 501 not implemented skeleton response', async () => {
  const controller = new EngineerMobileWorkbenchController();
  const methods = [
    'getCurrentContext',
    'listTasks',
    'getTaskDetail',
    'markArrived',
    'markStarted',
    'submitCompletion'
  ];

  for (const method of methods) {
    const req = { requestId: `synthetic-request-${method}` };
    const res = buildResponse();

    await controller[method](req, res);

    assert.equal(res.statusCode, 501);
    assert.equal(res.body.error.code, EXPECTED_NOT_IMPLEMENTED_CODE);
    assert.equal(res.body.error.requestId, req.requestId);
    assertNoSensitiveSkeletonPayload(res.body);
  }
});

test('permission guard skeleton does not return allow or deny decision', async () => {
  const guard = new EngineerMobileWorkbenchPermissionGuard();
  const result = await guard.checkCurrentContextAccess();

  assert.equal(result.implemented, false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'allowed'), false);
});

test('projection skeleton returns allow-list placeholder only', async () => {
  const projection = new EngineerMobileWorkbenchProjection();
  const result = await projection.buildTaskListProjection();

  assert.equal(result.implemented, false);
  assert.equal(result.allowListOnly, true);
  assert.equal(result.data, null);
});

test('auth/session boundary skeleton returns no authenticated context', async () => {
  const authSessionBoundary = new EngineerMobileWorkbenchAuthSessionBoundary();
  const result = await authSessionBoundary.buildCurrentContextSessionBoundary();

  assert.equal(result.implemented, false);
  assert.equal(result.authenticated, null);
  assert.equal(result.engineerContext, null);
});

test('completion submission boundary skeleton does not mutate or create draft', async () => {
  const completionBoundary = new EngineerMobileWorkbenchCompletionSubmissionBoundary();
  const result = await completionBoundary.buildCompletionSubmissionBoundary();

  assert.equal(result.implemented, false);
  assert.equal(result.stateMutated, false);
  assert.equal(result.draftCreated, null);
  assert.equal(result.validation.implemented, false);
  assert.equal(
    result.validation.code,
    'ENGINEER_MOBILE_WORKBENCH_COMPLETION_VALIDATOR_NOT_IMPLEMENTED'
  );
});

test('completion submission validator skeleton does not make real validation decision', async () => {
  const validator = new EngineerMobileWorkbenchCompletionSubmissionValidator();
  const result = await validator.validateCompletionSubmissionPayload();

  assert.equal(result.implemented, false);
  assert.equal(result.code, 'ENGINEER_MOBILE_WORKBENCH_COMPLETION_VALIDATOR_NOT_IMPLEMENTED');
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'valid'), false);
  assert.equal(result.validationDecision, null);
  assert.equal(
    result.policy.forbiddenFieldMarkers.includes('finalAppointmentId'),
    true
  );
});
