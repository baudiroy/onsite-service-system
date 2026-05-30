'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  resolver: 'src/customerAccess/customerAccessResolver.js',
  service: 'src/customerAccess/customerAccessService.js',
  responseEnvelope: 'src/customerAccess/customerAccessResponseEnvelope.js',
  controller: 'src/controllers/customerAccessController.js',
  httpContextAdapter: 'src/customerAccess/customerAccessHttpContextAdapter.js',
  resolverUnit: 'tests/customerAccess/customerAccessResolver.unit.test.js',
  mountedSafeDenyUnit: 'tests/customerAccess/customerAccessMountedRouteSafeDeny.unit.test.js',
  requestContextClosure: 'tests/customerAccess/customerAccessRequestContextResolverClosure.static.test.js',
  projectionAllowlist: 'tests/customerAccess/customerFacingProjectionAllowlist.static.test.js',
  task2248: 'docs/task-2248-customer-access-branch-re-entry-planning-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2251: 'docs/task-2251-customer-access-projection-allowlist-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2254: 'docs/task-2254-customer-access-safe-report-envelope-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
});

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
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

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, label);
  }
}

test('Task2255 static guard source test and doc evidence files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('resolver safe-deny remains generic while keeping internal reason codes out of customer envelope output', () => {
  const resolver = read(FILES.resolver);
  const service = read(FILES.service);
  const responseEnvelope = read(FILES.responseEnvelope);
  const controller = read(FILES.controller);
  const mountedSafeDenyUnit = read(FILES.mountedSafeDenyUnit);

  assertContainsAll(resolver, [
    /const GENERIC_DENY_MESSAGE_KEY = 'customerAccess\.unavailable';/,
    /function safeDeny\(internalReasonCode\)/,
    /allowed:\s*false/,
    /status:\s*'deny'/,
    /messageKey:\s*GENERIC_DENY_MESSAGE_KEY/,
    /customerVisible:\s*false/,
    /internalReasonCode/,
  ], FILES.resolver);
  assert.match(service, /if \(!decision\.allowed\) \{\s*return buildCustomerAccessEnvelope\(\{ decision \}\);\s*\}/);
  assert.match(responseEnvelope, /function buildCustomerAccessDenyEnvelope\(\)/);
  assert.match(responseEnvelope, /data:\s*null/);
  assert.match(responseEnvelope, /error:\s*\{\s*messageKey:\s*DENY_MESSAGE_KEY,\s*\}/);
  assert.match(responseEnvelope, /'internalReasonCode'/);
  assert.match(controller, /function safeDenyEnvelope\(\)/);
  assert.match(controller, /error:\s*\{\s*messageKey:\s*SAFE_DENY_ENVELOPE\.error\.messageKey,\s*\}/);
  assert.match(mountedSafeDenyUnit, /mounted customer access route returns generic safe-deny without verified context/);
  assert.match(mountedSafeDenyUnit, /Object\.keys\(body\.error\), \['messageKey'\]/);
});

test('unauthorized missing malformed conflicting and cross-scope access stay fail-closed without existence disclosure', () => {
  const resolver = read(FILES.resolver);
  const resolverUnit = read(FILES.resolverUnit);
  const mountedSafeDenyUnit = read(FILES.mountedSafeDenyUnit);
  const requestContextClosure = read(FILES.requestContextClosure);
  const task2248 = read(FILES.task2248);
  const task2251 = read(FILES.task2251);

  assertContainsAll(resolver, [
    /MISSING_INPUT/,
    /MISSING_ORGANIZATION_SCOPE/,
    /UNVERIFIED_CUSTOMER_IDENTITY/,
    /MISSING_CASE_LINKAGE/,
    /PUBLICATION_NOT_ALLOWED/,
    /CUSTOMER_VISIBLE_POLICY_FAILED/,
  ], FILES.resolver);
  assertContainsAll(resolverUnit, [
    /denies missing input/,
    /denies missing organization scope/,
    /denies unverified customer identity/,
    /denies missing Case linkage/,
    /denies when publication is not allowed/,
    /denies when customer-visible policy fails/,
  ], FILES.resolverUnit);
  assert.match(requestContextClosure, /malformed scoped case or report identifiers fail closed/);
  assert.match(requestContextClosure, /ambiguous identity sources fail closed/);
  assert.match(mountedSafeDenyUnit, /does not expose case, customer, org, identity, or publication reason/);
  assert.match(mountedSafeDenyUnit, /case exists/);
  assert.match(mountedSafeDenyUnit, /customer exists/);
  assert.match(task2248, /Safe deny must not reveal existence or non-existence of case\/report data/);
  assert.match(task2248, /unauthorized, missing, malformed, conflicting, or cross-scope access/);
  assert.match(task2251, /Safe-deny \/ generic not-found behavior remains required/);
  assert.match(task2251, /unauthorized, missing, malformed, conflicting, or cross-scope customer-facing access/);
});

test('safe-deny and customer-facing envelopes exclude internal identifiers provider audit AI billing DB SQL and debug fields', () => {
  const responseEnvelope = read(FILES.responseEnvelope);
  const resolverUnit = read(FILES.resolverUnit);
  const mountedSafeDenyUnit = read(FILES.mountedSafeDenyUnit);
  const task2254 = read(FILES.task2254);

  for (const forbiddenKey of [
    'customerExists',
    'fullAddress',
    'fullPhone',
    'identityMismatchReason',
    'internalReason',
    'internalReasonCode',
    'organizationMismatchReason',
    'permissionDetails',
    'publicationInternalReason',
    'rawAddress',
    'rawLineUserId',
    'rawPhone',
    'lineAccessToken',
    'lineUserId',
    'line_user_id',
    'auditLog',
    'aiRawPayload',
    'billingInternalData',
    'token',
    'secret',
  ]) {
    assert.match(responseEnvelope, new RegExp(`'${forbiddenKey}'`), `${forbiddenKey} should stay filtered`);
  }

  assertContainsAll(resolverUnit, [
    /finalAppointmentId/,
    /audit log should never leak/,
    /ai raw payload should never leak/,
    /internal billing data should never leak/,
  ], FILES.resolverUnit);
  assertContainsAll(mountedSafeDenyUnit, [
    /MISSING_ORGANIZATION_SCOPE/,
    /UNVERIFIED_CUSTOMER_IDENTITY/,
    /MISSING_CASE_LINKAGE/,
    /PUBLICATION_NOT_ALLOWED/,
    /CUSTOMER_VISIBLE_POLICY_FAILED/,
    /auditEvent/,
    /auditWritten/,
  ], FILES.mountedSafeDenyUnit);
  assert.match(task2254, /Raw\/private\/internal\/provider\/audit\/AI\/RAG\/billing\/debug fields are not exposed/);
});

test('LINE and provider identifiers remain scoped and cannot act as global customer identity', () => {
  const resolver = read(FILES.resolver);
  const httpContextAdapter = read(FILES.httpContextAdapter);
  const resolverUnit = read(FILES.resolverUnit);
  const projectionAllowlist = read(FILES.projectionAllowlist);
  const task2248 = read(FILES.task2248);
  const task2251 = read(FILES.task2251);

  assert.match(resolver, /function hasScopedChannelOnly\(input\)/);
  assert.match(resolver, /organizationId.*lineChannelId.*lineUserId/s);
  assert.match(resolver, /SCOPED_CHANNEL_IDENTITY_ONLY/);
  assert.match(resolver, /LINE_ID_ONLY/);
  assert.match(httpContextAdapter, /scopedChannelIdentityPresent:\s*Boolean\(organizationId && lineChannelId && lineUserId\)/);
  assert.match(resolverUnit, /denies LINE id alone as an authorization basis/);
  assert.match(resolverUnit, /denies scoped channel identity alone as an authorization basis/);
  assert.match(projectionAllowlist, /provider identifiers remain scoped and cannot act as global identity/);
  assert.match(task2248, /Provider identities must remain scoped by organization, channel, and verified customer context/);
  assert.match(task2251, /Provider IDs, including LINE, must not be treated as global identity/);
});

test('customer identity contact address and access context remain minimized and organization-scoped', () => {
  const resolver = read(FILES.resolver);
  const httpContextAdapter = read(FILES.httpContextAdapter);
  const responseEnvelope = read(FILES.responseEnvelope);
  const task2251 = read(FILES.task2251);

  assert.match(resolver, /function organizationScopePasses\(input\)/);
  assert.match(resolver, /organizationScope\.present === true && input\.organizationScope\.matches === true/);
  assert.match(resolver, /function customerIdentityVerified\(input\)/);
  assert.match(httpContextAdapter, /const CUSTOMER_ACCESS_CONTEXT_SECTIONS = Object\.freeze/);
  assert.match(httpContextAdapter, /'params'/);
  assert.match(httpContextAdapter, /'auth'/);
  assert.match(httpContextAdapter, /'channel'/);
  assert.match(httpContextAdapter, /'access'/);
  assert.match(httpContextAdapter, /const CUSTOMER_VISIBLE_DATA_KEYS = Object\.freeze\(\[\s*'serviceReport',\s*\]\)/);
  assert.match(httpContextAdapter, /const CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS = Object\.freeze/);
  assert.doesNotMatch(httpContextAdapter, /rawPhone|rawAddress|rawLineUserId|fullPhone|fullAddress/);
  assert.match(responseEnvelope, /'phone'/);
  assert.match(responseEnvelope, /'address'/);
  assert.match(responseEnvelope, /'rawPhone'/);
  assert.match(responseEnvelope, /'rawAddress'/);
  assert.match(task2251, /Organization isolation and permission checks remain required/);
});

test('resolver safe-deny guard is static text-only and resolver path keeps runtime dependency boundary narrow', () => {
  const currentTestSource = read('tests/customerAccess/customerAccessResolverSafeDenyBehavior.static.test.js');
  const resolver = read(FILES.resolver);
  const service = read(FILES.service);
  const responseEnvelope = read(FILES.responseEnvelope);

  assert.deepEqual(requireSpecifiers(currentTestSource), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.deepEqual(requireSpecifiers(resolver), []);
  assert.deepEqual(requireSpecifiers(service), [
    './customerAccessResolver',
    './customerAccessResponseEnvelope',
  ]);
  assert.deepEqual(requireSpecifiers(responseEnvelope), []);

  for (const [file, source] of [
    [FILES.resolver, resolver],
    [FILES.service, service],
    [FILES.responseEnvelope, responseEnvelope],
  ]) {
    assert.doesNotMatch(source, /process\.env|DATABASE_URL|Zeabur|new Pool|createPool|psql|migration|db:migrate/i, file);
    assert.doesNotMatch(source, /fetch\(|axios|http\.request|https\.request|app\.listen|express\s*\(|Router\s*\(/i, file);
    assert.doesNotMatch(source, /send(Line|Sms|SMS|Email|Webhook)|OpenAI|RAG|vector/i, file);
  }

  for (const [file, source] of [
    [FILES.resolver, resolver],
    [FILES.service, service],
  ]) {
    assert.doesNotMatch(source, /provider|billing|settlement|payment|invoice/i, file);
  }
});
