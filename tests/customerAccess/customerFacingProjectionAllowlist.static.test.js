'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  projectionService: 'src/customerAccess/customerServiceReportProjectionService.js',
  projectionHandler: 'src/customerAccess/customerServiceReportProjectionHandler.js',
  responseEnvelope: 'src/customerAccess/customerAccessResponseEnvelope.js',
  resolver: 'src/customerAccess/customerAccessResolver.js',
  task2248: 'docs/task-2248-customer-access-branch-re-entry-planning-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  completionFlow: 'docs/design/customer-facing-completion-flow.md',
  dataAccess: 'docs/design/data-access-control.md',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function objectFreezeArray(source, constantName) {
  const match = source.match(new RegExp(`${constantName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));

  assert.ok(match, `${constantName} should be declared as an Object.freeze array`);

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

function functionSource(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  const end = nextFunctionName
    ? source.indexOf(`function ${nextFunctionName}`, start + 1)
    : -1;

  assert.notEqual(start, -1, `${functionName} should exist`);

  return source.slice(start, end === -1 ? undefined : end);
}

test('Task2249 static guard source and planning files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('customer-facing service-report projection output keys stay explicitly allowlisted', () => {
  const projectionService = read(FILES.projectionService);
  const projectionHandler = read(FILES.projectionHandler);

  assert.deepEqual(objectFreezeArray(projectionService, 'CUSTOMER_SERVICE_REPORT_RESPONSE_KEYS'), [
    'customerReportReference',
    'caseReference',
    'serviceStatus',
    'appointmentWindow',
    'engineerDisplayName',
    'serviceSummary',
    'completionTime',
    'publicAttachments',
  ]);
  assert.deepEqual(objectFreezeArray(projectionService, 'CUSTOMER_PUBLIC_ATTACHMENT_RESPONSE_KEYS'), [
    'attachmentId',
    'label',
    'mimeType',
  ]);
  assert.deepEqual(objectFreezeArray(projectionHandler, 'SERVICE_REPORT_KEYS'), [
    'appointmentWindow',
    'caseReference',
    'completionTime',
    'customerReportReference',
    'engineerDisplayName',
    'publicAttachments',
    'serviceStatus',
    'serviceSummary',
  ]);
  assert.deepEqual(objectFreezeArray(projectionHandler, 'PUBLIC_ATTACHMENT_KEYS'), [
    'attachmentId',
    'label',
    'mimeType',
  ]);
});

test('projection allowlist builders copy approved fields only and do not spread raw rows', () => {
  const projectionService = read(FILES.projectionService);
  const serviceReportAllowlist = functionSource(
    projectionService,
    'customerServiceReportResponseAllowlist',
    'customerPublicAttachmentResponseAllowlist',
  );
  const attachmentAllowlist = functionSource(
    projectionService,
    'customerPublicAttachmentResponseAllowlist',
    'buildAllowEnvelope',
  );
  const buildAllowEnvelope = functionSource(
    projectionService,
    'buildAllowEnvelope',
    'rowValue',
  );
  const scopedProjectionSources = [
    serviceReportAllowlist,
    attachmentAllowlist,
    buildAllowEnvelope,
  ].join('\n');

  assert.match(serviceReportAllowlist, /for \(const key of CUSTOMER_SERVICE_REPORT_RESPONSE_KEYS\)/);
  assert.match(serviceReportAllowlist, /serviceReport\[key\] = candidate\[key\]/);
  assert.match(attachmentAllowlist, /for \(const key of CUSTOMER_PUBLIC_ATTACHMENT_RESPONSE_KEYS\)/);
  assert.match(attachmentAllowlist, /attachment\[key\] = candidate\[key\]/);
  assert.match(buildAllowEnvelope, /serviceReport: allowlistedServiceReport/);
  assert.doesNotMatch(scopedProjectionSources, /\.\.\.\s*(?:row|candidate|result|serviceResult|value)|Object\.assign\(/);
  assert.doesNotMatch(scopedProjectionSources, /return\s+(?:row|candidate|result|serviceResult|value)\b/);
});

test('known customer-facing response boundaries do not serialize raw internal data shapes', () => {
  const projectionService = read(FILES.projectionService);
  const projectionHandler = read(FILES.projectionHandler);
  const responseEnvelope = read(FILES.responseEnvelope);
  const unsafeOutputPatterns = [
    /serviceReport\.(?:finalAppointmentId|internalAppointmentId|internalActorId|engineerUserId|organizationInternal|auditLog|auditRows?|rawContact|rawAddress|rawSignature|rawPhoto|privateReportBody|sql|token|password|debug|internalNote|aiRawPayload|billingInternalData|settlementInternalData|payment|invoice)\s*=/i,
    /body:\s*(?:serviceResult|result|row|raw|dbRows?|repositoryRows?|auditRows?|providerPayload|aiResult)/i,
    /json\(\s*(?:serviceResult|result|row|raw|dbRows?|repositoryRows?|auditRows?|providerPayload|aiResult)\s*\)/i,
    /\.\.\.\s*(?:row|rows|result|serviceResult|dbRow|dbRows|repositoryRow|repositoryRows|auditRow|auditRows|providerPayload|aiResult|input\.data|data)/i,
    /Object\.assign\(\s*(?:serviceReport|data|body|response)[^)]*(?:row|result|serviceResult|dbRows?|repositoryRows?|auditRows?|providerPayload|aiResult)/i,
  ];

  for (const [label, source] of [
    ['projectionService', projectionService],
    ['projectionHandler', projectionHandler],
    ['responseEnvelope', responseEnvelope],
  ]) {
    for (const pattern of unsafeOutputPatterns) {
      assert.doesNotMatch(source, pattern, label);
    }
  }
});

test('HTTP and generic customer access envelopes keep safe-deny and customer-visible field filtering markers', () => {
  const projectionHandler = read(FILES.projectionHandler);
  const responseEnvelope = read(FILES.responseEnvelope);

  assert.deepEqual(objectFreezeArray(projectionHandler, 'HTTP_ENVELOPE_KEYS'), [
    'customerVisible',
    'data',
    'error',
    'messageKey',
    'status',
  ]);
  assert.match(projectionHandler, /function safeDenyEnvelope\(\)/);
  assert.match(projectionHandler, /statusCodeForEnvelope\(envelope\)/);
  assert.match(projectionHandler, /envelope && envelope\.status === 'allow' \? 200 : 404/);
  assert.match(projectionHandler, /function safeHttpEnvelopeFromServiceResult\(serviceResult,\s*customerAccessContext\)/);
  assert.match(projectionHandler, /hasOnlyAllowedKeys\(serviceResult, HTTP_ENVELOPE_KEYS\)/);
  assert.match(responseEnvelope, /const FORBIDDEN_KEYS = new Set\(\[/);
  assert.match(responseEnvelope, /function sanitizeCustomerVisibleData\(value\)/);
  assert.match(responseEnvelope, /if \(isForbiddenKey\(key\)\) \{\s*continue;\s*\}/);

  for (const forbiddenKey of [
    'auditLog',
    'billingInternalData',
    'fullAddress',
    'fullPhone',
    'internalNote',
    'lineAccessToken',
    'lineUserId',
    'rawAddress',
    'rawLineUserId',
    'rawPhone',
    'secret',
    'settlementInternalData',
    'token',
  ]) {
    assert.match(responseEnvelope, new RegExp(`'${forbiddenKey}'`), `${forbiddenKey} should stay filtered`);
  }
});

test('customer access context and provider identifiers remain scoped and cannot act as global identity', () => {
  const resolver = read(FILES.resolver);
  const responseEnvelope = read(FILES.responseEnvelope);
  const dataAccessDoc = read(FILES.dataAccess);

  assert.match(resolver, /function hasScopedChannelOnly\(input\)/);
  assert.match(resolver, /organizationId.*lineChannelId.*lineUserId/s);
  assert.match(resolver, /SCOPED_CHANNEL_IDENTITY_ONLY/);
  assert.match(resolver, /LINE_ID_ONLY/);
  assert.match(responseEnvelope, /'lineUserId'/);
  assert.match(responseEnvelope, /'line_user_id'/);
  assert.match(responseEnvelope, /'rawLineUserId'/);
  assert.match(dataAccessDoc, /organization scope/);
  assert.match(dataAccessDoc, /Customer self-service inquiry, LINE inquiry, Web portal, App inquiry, and customer-facing AI/);
});

test('Task2248 and design docs keep customer-facing projection-only and safe-deny guardrails visible', () => {
  const task2248 = read(FILES.task2248);
  const completionFlow = read(FILES.completionFlow);
  const dataAccess = read(FILES.dataAccess);

  assert.match(task2248, /Customer-facing data must be publication\/projection only/);
  assert.match(task2248, /Safe deny must not reveal existence or non-existence of case\/report data/);
  assert.match(task2248, /AI\/RAG must not expand customer-visible scope, bypass permission/);
  assert.match(completionFlow, /must not expose internal report details wholesale/);
  assert.match(completionFlow, /Must not include:/);
  assert.match(dataAccess, /Customer must not see:/);
  assert.match(dataAccess, /AI is not an exception/);
});
