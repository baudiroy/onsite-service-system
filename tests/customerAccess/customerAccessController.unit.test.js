'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessControllerResponse,
  handleCustomerAccessRequest,
} = require('../../src/controllers/customerAccessController');

function validReq() {
  return {
    params: { caseId: 'case-synthetic' },
    auth: {
      organizationId: 'org-synthetic',
      customerId: 'customer-synthetic',
      customerIdentityVerified: true,
    },
    channel: {
      lineChannelId: 'line-channel-synthetic',
      lineUserId: 'U1234567890abcdef',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
      },
    },
  };
}

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
];

function assertSafeResponse(response) {
  const serialized = JSON.stringify(response);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `controller response leaked forbidden value: ${value}`);
  }
}

function assertGenericDeny(response) {
  assert.deepEqual(response, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertSafeResponse(response);
}

function createSyntheticRes() {
  const calls = {
    status: [],
    json: [],
  };

  return {
    calls,
    status(code) {
      calls.status.push(code);
      return this;
    },
    json(body) {
      calls.json.push(body);
      return body;
    },
  };
}

test('valid verified request returns allow envelope', () => {
  const response = buildCustomerAccessControllerResponse(validReq());

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
      },
    },
  });
  assertSafeResponse(response);
});

test('missing input returns generic safe-deny without exception', () => {
  assertGenericDeny(buildCustomerAccessControllerResponse());
});

test('missing organization id returns generic safe-deny', () => {
  const req = validReq();
  delete req.auth.organizationId;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('missing case id returns generic safe-deny', () => {
  const req = validReq();
  delete req.params.caseId;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('unverified customer identity returns generic safe-deny', () => {
  const req = validReq();
  req.auth.customerIdentityVerified = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('raw phone only does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      access: { organizationScopeMatched: true },
      rawPhone: '0912-345-678',
    }),
  );
});

test('raw address only does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      access: { organizationScopeMatched: true },
      rawAddress: '台北市信義區測試路1號',
    }),
  );
});

test('LINE id alone does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      channel: { lineUserId: 'U1234567890abcdef' },
      access: { organizationScopeMatched: true },
    }),
  );
});

test('organizationId plus lineChannelId and lineUserId alone does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      channel: {
        lineChannelId: 'line-channel-synthetic',
        lineUserId: 'U1234567890abcdef',
      },
      access: { organizationScopeMatched: true },
    }),
  );
});

test('publication not allowed returns generic safe-deny', () => {
  const req = validReq();
  req.access.publicationAllowed = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('customer-visible policy failure returns generic safe-deny', () => {
  const req = validReq();
  req.access.customerVisiblePolicyPassed = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('deny response does not expose internal data or raw identifiers', () => {
  const req = validReq();
  req.auth.customerIdentityVerified = false;
  req.rawPhone = '0912-345-678';
  req.rawAddress = '台北市信義區測試路1號';
  req.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  req.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  req.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  req.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('handler writes res.status(...).json(...) once for allow', () => {
  const res = createSyntheticRes();
  const body = handleCustomerAccessRequest(validReq(), res);

  assert.deepEqual(res.calls.status, [200]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.equal(body.status, 'allow');
  assertSafeResponse(body);
});

test('handler writes res.status(...).json(...) once for deny', () => {
  const res = createSyntheticRes();
  const req = validReq();
  req.auth.customerIdentityVerified = false;
  const body = handleCustomerAccessRequest(req, res);

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.equal(body.status, 'deny');
  assertSafeResponse(body);
});

test('input req object is not mutated and finalAppointmentId is not modified', () => {
  const req = validReq();
  req.customerVisibleData.serviceReport.phone = '0912-345-678';
  const before = JSON.parse(JSON.stringify(req));

  const response = buildCustomerAccessControllerResponse(req);

  assert.deepEqual(req, before);
  assert.equal(req.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(response.data.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertSafeResponse(response);
});
