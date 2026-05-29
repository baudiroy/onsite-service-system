'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createServerBootstrap,
} = require('../../src/server');
const {
  handleCustomerServiceReportProjectionRequest,
} = require('../../src/customerAccess/customerServiceReportProjectionHandler');

const repoRoot = path.resolve(__dirname, '../..');
const serverFile = path.join(repoRoot, 'src/server.js');

function createRequest(pathname, method = 'GET') {
  const req = new Readable({
    read() {
      this.push(null);
    },
  });

  req.method = method;
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {};
  req.connection = {};

  return req;
}

function createResponse() {
  const chunks = [];
  const headers = {};

  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  res.statusCode = 200;
  res.setHeader = (name, value) => {
    headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => headers[name.toLowerCase()];
  res.removeHeader = (name) => {
    delete headers[name.toLowerCase()];
  };
  res.writeHead = (statusCode, headerValues, fallbackHeaders) => {
    res.statusCode = statusCode;
    const safeHeaders = typeof headerValues === 'string' ? fallbackHeaders : headerValues;

    if (typeof headerValues === 'string') {
      res.statusMessage = headerValues;
    }

    if (safeHeaders && typeof safeHeaders === 'object') {
      for (const [name, value] of Object.entries(safeHeaders)) {
        res.setHeader(name, value);
      }
    }
    return res;
  };
  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.from(chunk, encoding));
    }
    Writable.prototype.end.call(res, callback);
    return res;
  };
  res.headers = () => ({ ...headers });
  res.bodyText = () => Buffer.concat(chunks).toString('utf8');
  res.bodyJson = () => JSON.parse(res.bodyText());

  return res;
}

function requestApp(app, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, options.method || 'GET');
    const res = createResponse();

    res.on('finish', () => {
      try {
        resolve({
          body: res.bodyJson(),
          bodyText: res.bodyText(),
          headers: res.headers(),
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
        });
      } catch (error) {
        reject(error);
      }
    });
    res.on('error', reject);
    app.handle(req, res);
  });
}

function enabledOptions(overrides = {}) {
  return {
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
      CUSTOMER_ACCESS_READ_ONLY_ENABLED: 'true',
      CUSTOMER_ACCESS_DB_ENABLED: 'true',
      DATABASE_URL: 'postgres://db-url-should-not-leak',
      TOKEN: 'token_should_not_leak',
    },
    customerAccessDbClientConfig: {
      readOnly: true,
      connectionString: 'postgres://db-url-should-not-leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      password: 'password_should_not_leak',
    },
    customerAccess: {
      getInput() {
        return {
          organizationId: 'org_full_route_001',
          caseId: 'case_full_route_001',
          customerId: 'customer_full_route_001',
          rawPhone: 'raw_phone_should_not_leak',
          rawAddress: 'raw_address_should_not_leak',
          rawLineUserId: 'line_user_should_not_leak',
        };
      },
    },
    ...overrides,
  };
}

function allAllowRows() {
  return {
    caseRow: {
      id: 'case_full_route_001',
      organization_id: 'org_full_route_001',
      customer_id: 'customer_full_route_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_full_route_001',
      organization_id: 'org_full_route_001',
      verified: true,
      line_channel_id: 'line_channel_full_route_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: {
      case_id: 'case_full_route_001',
      organization_id: 'org_full_route_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      organization_id: 'org_full_route_001',
      customer_id: 'customer_full_route_001',
      case_id: 'case_full_route_001',
      public_report_id: 'report_public_full_route_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
      publication_state: 'published',
      customer_visible: true,
      case_display_id: 'CASE-FULL-ROUTE-001',
      service_status_display: 'Completed',
      appointment_window: '2026-05-29 09:00-10:00',
      engineer_display_name: 'Engineer Full Route',
      service_summary: 'Customer-safe full route summary',
      completion_time: '2026-05-29T10:00:00.000Z',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_response',
      internal_note: 'internal_note_should_not_leak',
      engineer_only_note: 'engineer_only_note_should_not_leak',
      dispatcher_note: 'dispatcher_note_should_not_leak',
      service_provider_internal_note: 'service_provider_internal_note_should_not_leak',
      subcontractor_internal_note: 'subcontractor_internal_note_should_not_leak',
      query_metadata: 'query_metadata_should_not_leak',
      query_config: 'query_config_should_not_leak',
      connector_internals: 'connector_internals_should_not_leak',
      raw_db_rows: 'raw_db_rows_should_not_leak',
      debug_marker: 'debug_marker_should_not_leak',
      audit_log: 'audit_log_should_not_leak',
      audit_metadata: 'audit_metadata_should_not_leak',
      ai_raw_payload: 'ai_raw_payload_should_not_leak',
      provider_payload: 'provider_payload_should_not_leak',
      webhook_payload: 'webhook_payload_should_not_leak',
      billing_internal_data: 'billing_internal_should_not_leak',
      billing_amount: 'billing_amount_should_not_leak',
      settlement_internal_data: 'settlement_internal_should_not_leak',
      settlement_amount: 'settlement_amount_should_not_leak',
      cost_amount: 'cost_amount_should_not_leak',
      invoice_id: 'invoice_should_not_leak',
      payment_id: 'payment_should_not_leak',
      organization_internal_fields: 'organization_internal_should_not_leak',
      unpublished_report_draft: 'unpublished_report_should_not_leak',
      raw_customer_phone: 'raw_customer_phone_should_not_leak',
      raw_customer_address: 'raw_customer_address_should_not_leak',
      raw_customer_contact: 'raw_customer_contact_should_not_leak',
      completion_report_approval_state: 'completion_report_approval_should_not_leak',
      fsr_publication_workflow: 'fsr_publication_workflow_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
    },
  };
}

function authorizedProjectionRequest() {
  return {
    params: {
      caseId: 'case_full_route_001',
      reportId: 'report_public_full_route_001',
    },
    customerAccessContext: {
      organizationId: 'org_full_route_001',
      customerId: 'customer_full_route_001',
      caseId: 'case_full_route_001',
      organizationScopeMatched: true,
      customerIdentityVerified: true,
      caseLinkedToCustomer: true,
      publication: {
        allowed: true,
        publicationState: 'published',
      },
      customerVisiblePolicyPassed: true,
      access: {
        organizationScopeMatched: true,
        caseLinkedToCustomer: true,
        publicationAllowed: true,
        customerVisiblePolicyPassed: true,
      },
      auth: {
        organizationId: 'org_full_route_001',
        customerId: 'customer_full_route_001',
        customerIdentityVerified: true,
      },
    },
  };
}

function createSyntheticPool(queryCalls, rowsOverride) {
  const safeCalls = Array.isArray(queryCalls) ? queryCalls : [];
  const rows = rowsOverride || allAllowRows();

  return {
    query(sql, params) {
      const sqlText = typeof sql === 'string' ? sql : sql && sql.text;
      const sqlParams = Array.isArray(params)
        ? params
        : (Array.isArray(sql && sql.values) ? sql.values : params);
      safeCalls.push({ sql: sqlText, params: sqlParams });

      if (sqlText.includes('from cases')) {
        return { rows: rows.caseRow ? [rows.caseRow] : [] };
      }
      if (sqlText.includes('from customer_channel_identities')) {
        return { rows: rows.customerIdentityRow ? [rows.customerIdentityRow] : [] };
      }
      if (sqlText.includes('from customer_access_publications')) {
        return { rows: rows.publicationRow ? [rows.publicationRow] : [] };
      }
      if (sqlText.includes('from customer_visible_service_reports')) {
        return { rows: rows.serviceReportRow ? [rows.serviceReportRow] : [] };
      }

      return { rows: [] };
    },
  };
}

function createAsyncSyntheticPool(queryCalls, rowsOverride) {
  const syntheticPool = createSyntheticPool(queryCalls, rowsOverride);

  return {
    query(sql, params) {
      return Promise.resolve(syntheticPool.query(sql, params));
    },
  };
}

function createProjectionFailurePool(queryCalls, projectionResult) {
  const safeCalls = Array.isArray(queryCalls) ? queryCalls : [];
  const syntheticPool = createSyntheticPool(queryCalls);

  return {
    query(sql, params) {
      const sqlText = typeof sql === 'string' ? sql : sql && sql.text;
      const sqlParams = Array.isArray(params)
        ? params
        : (Array.isArray(sql && sql.values) ? sql.values : params);
      const isProjectionQuery = String(sqlText).includes('public_report_id = $4')
        && Array.isArray(sqlParams)
        && sqlParams.length === 4;

      if (!isProjectionQuery) {
        return syntheticPool.query(sql, params);
      }

      safeCalls.push({ sql: sqlText, params: sqlParams });

      if (typeof projectionResult === 'function') {
        return projectionResult(sql, params);
      }

      return projectionResult;
    },
  };
}

function createMalformedResultPool(queryCalls) {
  const safeCalls = Array.isArray(queryCalls) ? queryCalls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      return { row: { internal_note: 'internal_note_should_not_leak' } };
    },
  };
}

function createInjectedApp(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    handle() {
      safeCalls.push('handle');
    },
    listen(port) {
      safeCalls.push(['listen', port]);
      return {
        close(callback) {
          if (callback) {
            callback();
          }
        },
      };
    },
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

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const unsafeValue of [
    'token_should_not_leak',
    'secret_should_not_leak',
    'password_should_not_leak',
    'postgres://db-url-should-not-leak',
    'connection_string_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_pool_error_should_not_leak',
    'connector_internal_should_not_leak',
    'projection_query_config_should_not_leak',
    'raw_projection_row_should_not_leak',
    'stack_should_not_leak',
    'internal_note_should_not_leak',
    'engineer_only_note_should_not_leak',
    'dispatcher_note_should_not_leak',
    'service_provider_internal_note_should_not_leak',
    'subcontractor_internal_note_should_not_leak',
    'query_metadata_should_not_leak',
    'query_config_should_not_leak',
    'connector_internals_should_not_leak',
    'raw_db_rows_should_not_leak',
    'debug_marker_should_not_leak',
    'audit_log_should_not_leak',
    'audit_metadata_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'provider_payload_should_not_leak',
    'webhook_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'billing_amount_should_not_leak',
    'storage_key_should_not_leak',
    'bucket_should_not_leak',
    'object_path_should_not_leak',
    'private_url_should_not_leak',
    'raw_url_should_not_leak',
    'upload_token_should_not_leak',
    'download_token_should_not_leak',
    'checksum_should_not_leak',
    'etag_should_not_leak',
    'file_metadata_should_not_leak',
    'uploader_identity_should_not_leak',
    'engineer_attachment_note_should_not_leak',
    'dispatcher_attachment_note_should_not_leak',
    'provider_attachment_note_should_not_leak',
    'subcontractor_attachment_note_should_not_leak',
    'attachment_audit_should_not_leak',
    'visibility_workflow_should_not_leak',
    'draft_attachment_should_not_leak',
    'deleted_attachment_should_not_leak',
    'rejected_attachment_should_not_leak',
    'implicit_attachment_should_not_leak',
    'invalid_attachment_should_not_leak',
    'attachment_phone_should_not_leak',
    'attachment_address_should_not_leak',
    'attachment_contact_should_not_leak',
    'attachment_billing_should_not_leak',
    'attachment_settlement_should_not_leak',
    'attachment_cost_should_not_leak',
    'settlement_internal_should_not_leak',
    'settlement_amount_should_not_leak',
    'cost_amount_should_not_leak',
    'invoice_should_not_leak',
    'payment_should_not_leak',
    'organization_internal_should_not_leak',
    'unpublished_report_should_not_leak',
    'raw_customer_phone_should_not_leak',
    'raw_customer_address_should_not_leak',
    'raw_customer_contact_should_not_leak',
    'completion_report_approval_should_not_leak',
    'fsr_publication_workflow_should_not_leak',
    'final_appointment_should_not_leak',
    'appt_should_not_be_in_response',
    'finalAppointmentId',
    'final_appointment_id',
    'select ',
    'from cases',
    'completion_time_token_should_not_leak',
    'service_status_token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(unsafeValue), false, `leaked ${unsafeValue}`);
  }
}

function assertJsonContentType(response) {
  assert.match(String(response.headers['content-type'] || ''), /^application\/json\b/i);
}

function assertNoDebugOrSecretHeaders(response) {
  for (const [name, value] of Object.entries(response.headers || {})) {
    assert.doesNotMatch(name, /x-powered-by|debug|internal|stack|sql|database|token|secret/i);
    assert.doesNotMatch(
      String(value),
      /debug|internal|stack|select secret|database|postgres:\/\/|token_should_not_leak|secret_should_not_leak/i,
    );
  }
}

function assertNoStatusTextLeak(response) {
  assert.doesNotMatch(
    String(response.statusMessage || ''),
    /debug|internal|stack|select secret|database|postgres:\/\/|token_should_not_leak|secret_should_not_leak/i,
  );
}

function assertSafeHttpResponseMetadata(response) {
  assertJsonContentType(response);
  assertNoDebugOrSecretHeaders(response);
  assertNoStatusTextLeak(response);
}

function assertStableFullRouteServiceReportShape(body) {
  assert.deepEqual(Object.keys(body).sort(), [
    'customerVisible',
    'data',
    'messageKey',
    'status',
  ].sort());
  assert.deepEqual(Object.keys(body.data).sort(), ['serviceReport']);
  assert.deepEqual(Object.keys(body.data.serviceReport).sort(), [
    'appointmentWindow',
    'caseReference',
    'completionTime',
    'customerReportReference',
    'engineerDisplayName',
    'serviceStatus',
    'serviceSummary',
  ].sort());
}

test('server explicit pool all-allow rows return HTTP 200 allow envelope', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createSyntheticPool(queryCalls),
  }));

  assert.deepEqual(queryCalls, []);

  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data, {
    serviceReport: {
      publicReportId: 'report_public_full_route_001',
      status: 'available',
    },
  });
  assertNoLeak(response.body);
});

test('server explicit async pool all-allow rows return HTTP 200 allow envelope', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  assert.deepEqual(queryCalls, []);

  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data, {
    serviceReport: {
      publicReportId: 'report_public_full_route_001',
      status: 'available',
    },
  });
  assertNoLeak(response.body);
});

test('server explicit async pool service report full route passes allow context to projection', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
  );

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.messageKey, 'customerAccess.serviceReport.available');
  assert.equal(response.body.customerVisible, true);
  assert.deepEqual(response.body.data, {
    serviceReport: {
      customerReportReference: 'report_public_full_route_001',
      caseReference: 'CASE-FULL-ROUTE-001',
      serviceStatus: 'Completed',
      appointmentWindow: '2026-05-29 09:00-10:00',
      engineerDisplayName: 'Engineer Full Route',
      serviceSummary: 'Customer-safe full route summary',
      completionTime: '2026-05-29T10:00:00.000Z',
    },
  });
  assertStableFullRouteServiceReportShape(response.body);

  const directResponse = await handleCustomerServiceReportProjectionRequest({
    request: authorizedProjectionRequest(),
    dbClient: createAsyncSyntheticPool([]),
  });

  assert.equal(directResponse.statusCode, 200);
  assert.deepEqual(response.body, directResponse.body);
  assertNoLeak(response.body);
});

test('server explicit async pool service report full route omits null empty optional DTO fields', async () => {
  const queryCalls = [];
  const rows = allAllowRows();

  rows.serviceReportRow = {
    ...rows.serviceReportRow,
    case_display_id: '',
    service_status_display: undefined,
    appointment_window: null,
    engineer_display_name: '   ',
    service_summary: '',
    completion_time: undefined,
    public_attachments: [
      {
        attachment_id: '',
        label: '',
        mime_type: '',
        signed_url: 'https://signed.example.invalid/secret',
      },
    ],
  };

  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls, rows),
  }));
  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
  );
  const directResponse = await handleCustomerServiceReportProjectionRequest({
    request: authorizedProjectionRequest(),
    dbClient: createAsyncSyntheticPool([], rows),
  });

  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assert.deepEqual(response.body, {
    status: 'allow',
    messageKey: 'customerAccess.serviceReport.available',
    customerVisible: true,
    data: {
      serviceReport: {
        customerReportReference: 'report_public_full_route_001',
      },
    },
  });
  assert.deepEqual(response.body, directResponse.body);
  assertNoLeak(response.body);
});

test('server explicit async pool service report full route omits malformed completion time', async () => {
  const queryCalls = [];
  const rows = allAllowRows();

  rows.serviceReportRow = {
    ...rows.serviceReportRow,
    completion_time: 'completion_time_token_should_not_leak',
  };

  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls, rows),
  }));
  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
  );
  const directResponse = await handleCustomerServiceReportProjectionRequest({
    request: authorizedProjectionRequest(),
    dbClient: createAsyncSyntheticPool([], rows),
  });

  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assert.equal(
    Object.prototype.hasOwnProperty.call(response.body.data.serviceReport, 'completionTime'),
    false,
  );
  assert.deepEqual(response.body, directResponse.body);
  assertNoLeak(response.body);
});

test('server explicit async pool service report full route omits malformed service status', async () => {
  const queryCalls = [];
  const rows = allAllowRows();

  rows.serviceReportRow = {
    ...rows.serviceReportRow,
    service_status_display: 'service_status_token_should_not_leak select secret from cases',
  };

  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls, rows),
  }));
  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
  );
  const directResponse = await handleCustomerServiceReportProjectionRequest({
    request: authorizedProjectionRequest(),
    dbClient: createAsyncSyntheticPool([], rows),
  });

  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assert.equal(
    Object.prototype.hasOwnProperty.call(response.body.data.serviceReport, 'serviceStatus'),
    false,
  );
  assert.deepEqual(response.body, directResponse.body);
  assertNoLeak(response.body);
});

test('server explicit async pool service report full route requires row publication fields', async () => {
  const queryCalls = [];
  const rows = allAllowRows();

  delete rows.serviceReportRow.publication_allowed;
  delete rows.serviceReportRow.customer_visible_policy_passed;
  delete rows.serviceReportRow.publication_state;
  delete rows.serviceReportRow.customer_visible;

  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls, rows),
  }));
  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
  );
  const directResponse = await handleCustomerServiceReportProjectionRequest({
    request: authorizedProjectionRequest(),
    dbClient: createAsyncSyntheticPool([], rows),
  });

  assert.equal(response.statusCode, 404);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.messageKey, 'customerAccess.unavailable');
  assert.deepEqual(response.body, directResponse.body);
  assertNoLeak(response.body);
});

test('server explicit async pool service report full route filters attachment visibility', async () => {
  const queryCalls = [];
  const rows = allAllowRows();

  rows.serviceReportRow = {
    ...rows.serviceReportRow,
    public_attachments: [
      {
        attachment_id: 'att_visible_full_route_001',
        label: 'Visible full-route photo',
        mime_type: 'image/jpeg',
        customer_visible: true,
        storage_key: 'storage_key_should_not_leak',
        bucket: 'bucket_should_not_leak',
        object_path: 'object_path_should_not_leak',
        signed_url: 'https://signed.example.invalid/secret',
        private_url: 'private_url_should_not_leak',
        raw_url: 'raw_url_should_not_leak',
        upload_token: 'upload_token_should_not_leak',
        download_token: 'download_token_should_not_leak',
        checksum: 'checksum_should_not_leak',
        etag: 'etag_should_not_leak',
        internal_file_metadata: 'file_metadata_should_not_leak',
        uploader_internal_identity: 'uploader_identity_should_not_leak',
        engineer_attachment_note: 'engineer_attachment_note_should_not_leak',
        dispatcher_note: 'dispatcher_attachment_note_should_not_leak',
        provider_note: 'provider_attachment_note_should_not_leak',
        subcontractor_note: 'subcontractor_attachment_note_should_not_leak',
        audit_metadata: 'attachment_audit_should_not_leak',
        visibility_workflow: 'visibility_workflow_should_not_leak',
        raw_phone: 'attachment_phone_should_not_leak',
        raw_address: 'attachment_address_should_not_leak',
        raw_contact: 'attachment_contact_should_not_leak',
        billing_metadata: 'attachment_billing_should_not_leak',
        settlement_metadata: 'attachment_settlement_should_not_leak',
        cost_metadata: 'attachment_cost_should_not_leak',
        final_appointment_id: 'final_appointment_should_not_leak',
        completion_report_workflow: 'completion_report_approval_should_not_leak',
        fsr_publication_workflow: 'fsr_publication_workflow_should_not_leak',
      },
      {
        publicAttachmentId: 'att_visible_full_route_002',
        displayName: 'Visible full-route receipt',
        mimeType: 'application/pdf',
        visibility: 'public',
      },
      {
        attachment_id: 'att_visible_full_route_003',
        label: 'Visible full-route attachment without trusted MIME',
        mime_type: 'text/html; charset=utf-8',
        customer_visible: true,
      },
      {
        attachment_id: 'att_visible_full_route_004',
        label: 'https://signed.example.invalid/private/internal-secret-photo.jpg',
        mime_type: 'image/jpeg',
        customer_visible: true,
      },
      {
        attachment_id: 'att_visible_full_route_005',
        fileName: '../private/internal-token-photo.jpg',
        mime_type: 'image/jpeg',
        visibility: 'public',
      },
      {
        attachment_id: 'https://signed.example.invalid/secret',
        label: 'invalid_attachment_should_not_leak',
        mime_type: 'image/png',
        customer_visible: true,
      },
      {
        attachment_id: '../internal/private',
        label: 'invalid_attachment_should_not_leak',
        mime_type: 'image/png',
        visibility: 'public',
      },
      {
        attachment_id: 'att_implicit_full_route_001',
        label: 'implicit_attachment_should_not_leak',
        mime_type: 'image/png',
      },
      {
        attachment_id: 'att_internal_full_route_001',
        label: 'storage_key_should_not_leak',
        mime_type: 'image/png',
        customer_visible: true,
        internal: true,
      },
      {
        attachment_id: 'att_draft_full_route_001',
        label: 'draft_attachment_should_not_leak',
        mime_type: 'image/png',
        visibility: 'draft',
      },
      {
        attachment_id: 'att_deleted_full_route_001',
        label: 'deleted_attachment_should_not_leak',
        mime_type: 'image/png',
        customer_visible: true,
        deleted: true,
      },
      {
        attachment_id: 'att_rejected_full_route_001',
        label: 'rejected_attachment_should_not_leak',
        mime_type: 'image/png',
        customer_visible: true,
        rejected: true,
      },
      {
        customer_visible: true,
        signed_url: 'https://signed.example.invalid/secret',
      },
      null,
      'invalid_attachment_should_not_leak',
    ],
  };

  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls, rows),
  }));
  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
  );
  const directResponse = await handleCustomerServiceReportProjectionRequest({
    request: authorizedProjectionRequest(),
    dbClient: createAsyncSyntheticPool([], rows),
  });

  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assert.deepEqual(response.body.data.serviceReport.publicAttachments, [
    {
      attachmentId: 'att_visible_full_route_001',
      label: 'Visible full-route photo',
      mimeType: 'image/jpeg',
    },
    {
      attachmentId: 'att_visible_full_route_002',
      label: 'Visible full-route receipt',
      mimeType: 'application/pdf',
    },
    {
      attachmentId: 'att_visible_full_route_003',
      label: 'Visible full-route attachment without trusted MIME',
    },
    {
      attachmentId: 'att_visible_full_route_004',
      mimeType: 'image/jpeg',
    },
    {
      attachmentId: 'att_visible_full_route_005',
      mimeType: 'image/jpeg',
    },
  ]);
  assert.deepEqual(response.body, directResponse.body);
  assertNoLeak(response.body);
});

test('server explicit pool service report route rejects unsupported method without querying projection', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
    { method: 'POST' },
  );

  assert.deepEqual(queryCalls, []);
  assert.equal(response.statusCode, 404);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.error.code, 'NOT_FOUND');
  assert.match(response.body.error.message, /Route not found: POST/);
  assertNoLeak(response.body);
});

test('server explicit pool malformed service report path stays not-found without projection query', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report',
  );

  assert.deepEqual(queryCalls, []);
  assert.equal(response.statusCode, 404);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.error.code, 'NOT_FOUND');
  assert.match(response.body.error.message, /Route not found: GET/);
  assertNoLeak(response.body);
});

test('server explicit pool suspicious service report params safe-deny before projection query', async () => {
  for (const pathname of [
    '/customer-access/case_full_route_001%27or%271%27%3D%271/service-report/report_public_full_route_001',
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001%3Bselect%20secret',
  ]) {
    const queryCalls = [];
    const bootstrap = createServerBootstrap(enabledOptions({
      customerAccessPool: createAsyncSyntheticPool(queryCalls),
    }));

    const response = await requestApp(bootstrap.app, pathname);

    assert.equal(response.statusCode, 404);
    assertSafeHttpResponseMetadata(response);
    assert.equal(response.body.status, 'deny');
    assert.equal(
      queryCalls.some((call) => (
        String(call.sql).includes('public_report_id = $4') &&
        Array.isArray(call.params) &&
        call.params.length === 4
      )),
      false,
    );
    assertNoLeak(response.body);
  }
});

test('server explicit pool query params cannot override service report route params', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001?caseId=case_query_override&reportId=report_query_override',
  );
  const projectionCall = queryCalls.find((call) => (
    String(call.sql).includes('public_report_id = $4') &&
    Array.isArray(call.params) &&
    call.params.length === 4
  ));

  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(projectionCall.params, [
    'org_full_route_001',
    'customer_full_route_001',
    'case_full_route_001',
    'report_public_full_route_001',
  ]);
  assertNoLeak(response.body);
});

test('server explicit pool projection failures return safe-deny without raw internals', async () => {
  for (const projectionResult of [
    () => {
      throw new Error(
        'connector_internal_should_not_leak select secret projection_query_config_should_not_leak',
      );
    },
    () => Promise.reject(new Error(
      'connector_internal_should_not_leak stack_should_not_leak postgres://db-url-should-not-leak',
    )),
    { rows: [] },
    {
      row: {
        rawProjectionRow: 'raw_projection_row_should_not_leak',
        stack: 'stack_should_not_leak',
        sql: 'select secret',
      },
    },
  ]) {
    const queryCalls = [];
    const bootstrap = createServerBootstrap(enabledOptions({
      customerAccessPool: createProjectionFailurePool(queryCalls, projectionResult),
    }));

    const response = await requestApp(
      bootstrap.app,
      '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
    );
    const projectionCalls = queryCalls.filter((call) => (
      String(call.sql).includes('public_report_id = $4') &&
      Array.isArray(call.params) &&
      call.params.length === 4
    ));

    assert.equal(projectionCalls.length, 1);
    assert.equal(response.statusCode, 404);
    assertSafeHttpResponseMetadata(response);
    assert.equal(response.body.status, 'deny');
    assertNoLeak(response.body);
  }
});

test('allow response strips internal report and sensitive fields', async () => {
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createSyntheticPool([]),
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(response.statusCode, 200);
  assertSafeHttpResponseMetadata(response);
  assertNoLeak(response.body);
});

test('readOnly false returns generic safe-deny 404 and pool is not queried', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createSyntheticPool(queryCalls),
    customerAccessDbClientConfig: {
      readOnly: false,
      connectionString: 'postgres://db-url-should-not-leak',
    },
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.deepEqual(queryCalls, []);
  assert.equal(response.statusCode, 404);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('pool query throw returns generic safe-deny 404 without raw error leak', async () => {
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: {
      query() {
        throw new Error('internal_pool_error_should_not_leak postgres://db-url-should-not-leak token_should_not_leak');
      },
    },
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(response.statusCode, 404);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('malformed pool result returns generic safe-deny 404', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createMalformedResultPool(queryCalls),
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 404);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('env disabled with pool returns default safe-deny and pool is not queried', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    env: {
      CUSTOMER_ACCESS_ENABLED: 'false',
      CUSTOMER_ACCESS_DB_ENABLED: 'true',
    },
    customerAccessPool: createSyntheticPool(queryCalls),
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.deepEqual(queryCalls, []);
  assert.equal(response.statusCode, 404);
  assertSafeHttpResponseMetadata(response);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('options.app priority bypasses pool path', () => {
  const calls = [];
  const queryCalls = [];
  const injectedApp = createInjectedApp(calls);
  const bootstrap = createServerBootstrap(enabledOptions({
    app: injectedApp,
    customerAccessPool: createSyntheticPool(queryCalls),
  }));

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(calls, []);
  assert.deepEqual(queryCalls, []);
});

test('server import does not trigger listen during bootstrap creation', () => {
  const calls = [];
  const injectedApp = createInjectedApp(calls);

  createServerBootstrap(enabledOptions({
    app: injectedApp,
    customerAccessPool: createSyntheticPool([]),
    port: 4061,
  }));

  assert.deepEqual(calls, []);
});

test('server source does not directly import restricted DB adapter, repository, provider, or AI modules', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessBootstrapComposer'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyRepository'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyDbConnector'), false);
  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /new Pool|createCustomerAccessDbAdapter|createCustomerAccessDbQueryExecutor|createCustomerAccessReadOnlyRepository|createCustomerAccessReadOnlyDbConnector/i);
});

test('test file uses only synthetic sentinel strings and no real secrets', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.equal(source.includes(['process', 'env'].join('.') + '.'), false);
  assert.equal(source.includes(['npm', 'run', 'db:migrate'].join(' ')), false);
  assert.equal(source.includes(['p', 's', 'q', 'l'].join('')), false);
  assert.equal(source.includes(['line', 'channel', 'secret'].join('_')), false);
  assert.equal(source.includes(['access', 'token'].join('_')), false);
});
