'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  requestContextResolver: 'src/customerAccess/customerAccessRequestContextResolver.js',
  contextProvider: 'src/customerAccess/customerAccessContextProvider.js',
  contextMiddleware: 'src/customerAccess/customerAccessContextMiddleware.js',
  httpContextAdapter: 'src/customerAccess/customerAccessHttpContextAdapter.js',
  resolver: 'src/customerAccess/customerAccessResolver.js',
  responseEnvelope: 'src/customerAccess/customerAccessResponseEnvelope.js',
  requestContextResolverUnit: 'tests/customerAccess/customerAccessRequestContextResolver.unit.test.js',
  requestContextResolverClosure: 'tests/customerAccess/customerAccessRequestContextResolverClosure.static.test.js',
  contextProviderUnit: 'tests/customerAccess/customerAccessContextProvider.unit.test.js',
  contextMiddlewareUnit: 'tests/customerAccess/customerAccessContextMiddleware.unit.test.js',
  resolverSafeDenyGuard: 'tests/customerAccess/customerAccessResolverSafeDenyBehavior.static.test.js',
  projectionAllowlistGuard: 'tests/customerAccess/customerFacingProjectionAllowlist.static.test.js',
  task2248: 'docs/task-2248-customer-access-branch-re-entry-planning-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2251: 'docs/task-2251-customer-access-projection-allowlist-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2255: 'docs/task-2255-customer-access-resolver-safe-deny-behavior-static-re-entry-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2256: 'docs/task-2256-customer-access-resolver-safe-deny-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
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

test('Task2257 static guard source test and evidence files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('trusted customer access context sources stay explicit and do not come from raw request containers', () => {
  const resolver = read(FILES.requestContextResolver);
  const middleware = read(FILES.contextMiddleware);
  const resolverUnit = read(FILES.requestContextResolverUnit);
  const middlewareUnit = read(FILES.contextMiddlewareUnit);

  assertContainsAll(resolver, [
    /function contextSourcesFromRequest\(request\)/,
    /isObject\(request\.customerAccessContext\)/,
    /sources\.push\(request\.customerAccessContext\)/,
    /isObject\(request\.syntheticCustomerAccessContext\)/,
    /sources\.push\(request\.syntheticCustomerAccessContext\)/,
    /if \(sources\.length !== 1\) \{\s*return deniedResolution\(\);\s*\}/,
    /customerAccessContext:\s*buildNormalizedContext\(context\)/,
  ], FILES.requestContextResolver);
  assert.doesNotMatch(resolver, /headers|authorization|cookie|rawBody|body|query|session|user|providerPayload|debug/i);

  assertContainsAll(middleware, [
    /function contextInputFromRequest\(req\)/,
    /safeProperty\(req,\s*'customerAccessContextInput'\)/,
    /const CUSTOMER_ACCESS_CONTEXT_SECTIONS = Object\.freeze/,
    /const AUTH_KEYS = Object\.freeze/,
    /const ACCESS_KEYS = Object\.freeze/,
    /function sanitizedCustomerAccessContext\(context\)/,
  ], FILES.contextMiddleware);
  assert.doesNotMatch(middleware, /safeProperty\(req,\s*'(?:body|query|headers|rawBody|cookies|session|user|providerPayload|debug|env)'\)/);

  assert.match(resolverUnit, /request params query body and headers cannot override normalized context identifiers/);
  assert.match(resolverUnit, /raw bearer token header and cookie alone are not trusted as identity/);
  assert.match(middlewareUnit, /middleware output omits raw request auth session user and provider containers/);
  assert.match(middlewareUnit, /middleware customerVisibleData uses only the explicit approved source location/);
});

test('raw internal identifiers and customer-controlled fields are not trusted as access context', () => {
  const resolver = read(FILES.requestContextResolver);
  const middleware = read(FILES.contextMiddleware);
  const resolverUnit = read(FILES.requestContextResolverUnit);
  const middlewareUnit = read(FILES.contextMiddlewareUnit);

  assertContainsAll(resolver, [
    /function hasMalformedContextIdentifier\(context\)/,
    /context\.organizationId/,
    /context\.auth && context\.auth\.organizationId/,
    /context\.customerId/,
    /context\.auth && context\.auth\.customerId/,
    /context\.caseId/,
    /context\.params && context\.params\.caseId/,
    /context\.reportId/,
    /context\.params && context\.params\.reportId/,
  ], FILES.requestContextResolver);
  assert.doesNotMatch(
    resolver,
    /appointmentId|finalAppointmentId|completionReportId|fieldServiceReportId|engineerUserId|internalActorId|role|permissionDetails|debug|internalReason/,
  );

  assert.match(middleware, /const CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS = Object\.freeze/);
  assert.match(middleware, /'finalAppointmentId'/);
  assert.match(middleware, /function sanitizedCustomerVisibleServiceReport\(value\)/);
  assert.match(middleware, /for \(const key of CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS\)/);
  assert.doesNotMatch(middleware, /safeProperty\(input,\s*'(?:appointmentId|completionReportId|fieldServiceReportId|engineerUserId|internalActorId|role|permissionDetails|debug|internalReason)'\)/);

  assert.match(resolverUnit, /malformed fallback context identifiers fail closed instead of using alternate sources/);
  assert.match(resolverUnit, /nested forbidden sensitive fields are excluded from resolver output/);
  assert.match(middlewareUnit, /middleware output strips sensitive identity policy and debug details from context/);
  assert.match(middlewareUnit, /middleware customerVisibleData emits only explicit deep allowlist keys/);
});

test('LINE and provider identifiers remain scoped and cannot become broad global identity', () => {
  const contextProvider = read(FILES.contextProvider);
  const resolver = read(FILES.resolver);
  const contextProviderUnit = read(FILES.contextProviderUnit);
  const resolverSafeDenyGuard = read(FILES.resolverSafeDenyGuard);
  const task2248 = read(FILES.task2248);
  const task2256 = read(FILES.task2256);

  assertContainsAll(contextProvider, [
    /const lineChannelId = stringValue\(input\.lineChannelId\)/,
    /const lineUserId = stringValue\(input\.lineUserId\)/,
    /identityLinkResolutionFromSources\(\[input\]/,
    /organizationId,\s*customerId:\s*rawCustomerId,\s*caseId,\s*contactId,\s*lineChannelId,\s*lineUserId/s,
    /const hasScopedChannelIdentity = Boolean\(organizationId && lineChannelId && lineUserId\)/,
  ], FILES.contextProvider);
  assert.match(resolver, /function hasScopedChannelOnly\(input\)/);
  assert.match(resolver, /SCOPED_CHANNEL_IDENTITY_ONLY/);
  assert.match(resolver, /LINE_ID_ONLY/);
  assert.match(contextProviderUnit, /line user id alone does not become verified identity or scoped channel metadata/);
  assert.match(contextProviderUnit, /linked LINE identity resolves customer identity without treating LINE as global identity/);
  assert.match(contextProviderUnit, /organization, line channel, and line user id alone do not become verified identity/);
  assert.match(resolverSafeDenyGuard, /LINE and provider identifiers remain scoped and cannot act as global customer identity/);
  assert.match(task2248, /Provider identities must remain scoped by organization, channel, and verified customer context/);
  assert.match(task2256, /Provider IDs, including LINE, are not global identity/);
});

test('customer identity contact address and visible data remain minimized and scoped', () => {
  const contextProvider = read(FILES.contextProvider);
  const middleware = read(FILES.contextMiddleware);
  const httpContextAdapter = read(FILES.httpContextAdapter);
  const responseEnvelope = read(FILES.responseEnvelope);
  const task2256 = read(FILES.task2256);

  for (const forbiddenKey of [
    'address',
    'fullAddress',
    'fullPhone',
    'phone',
    'providerPayload',
    'providerRawPayload',
    'rawAddress',
    'rawLineUserId',
    'rawPhone',
    'token',
    'secret',
  ]) {
    assert.match(contextProvider, new RegExp(`'${forbiddenKey}'`), `${forbiddenKey} should stay filtered`);
  }

  assert.match(middleware, /const CUSTOMER_VISIBLE_DATA_KEYS = Object\.freeze\(\[\s*'serviceReport',\s*\]\)/);
  assert.match(middleware, /const CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS = Object\.freeze/);
  assert.match(httpContextAdapter, /const CUSTOMER_VISIBLE_DATA_KEYS = Object\.freeze\(\[\s*'serviceReport',\s*\]\)/);
  assert.match(httpContextAdapter, /const CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS = Object\.freeze/);
  assert.match(responseEnvelope, /const FORBIDDEN_KEYS = new Set\(\[/);
  assert.match(task2256, /Customer identity\/contact\/address data remains minimized and scoped/);
});

test('missing malformed conflicting and cross-scope context remains safe-deny without existence disclosure', () => {
  const requestContextResolver = read(FILES.requestContextResolver);
  const requestContextResolverUnit = read(FILES.requestContextResolverUnit);
  const task2255 = read(FILES.task2255);
  const task2256 = read(FILES.task2256);

  assertContainsAll(requestContextResolver, [
    /const SAFE_DENY_MESSAGE_KEY = 'customerAccess\.unavailable';/,
    /function deniedResolution\(\)/,
    /resolved:\s*false/,
    /messageKey:\s*SAFE_DENY_MESSAGE_KEY/,
    /customerVisible:\s*false/,
    /customerAccessContext:\s*null/,
    /hasMalformedContextIdentifier\(context\) \|\| !isAuthorizedSyntheticContext\(context\)/,
  ], FILES.requestContextResolver);
  assert.match(requestContextResolverUnit, /missing request fails closed/);
  assert.match(requestContextResolverUnit, /unauthorized context fails closed/);
  assert.match(requestContextResolverUnit, /malformed scoped case or report identifiers fail closed/);
  assert.match(requestContextResolverUnit, /ambiguous identity sources fail closed/);
  assert.match(task2255, /safe-deny behavior does not reveal whether Case, Appointment, Field Service Report, Completion Report, or customer-facing report data exists/);
  assert.match(task2256, /does not reveal whether case\/report data exists/);
});

test('context and resolver files do not add unsafe runtime DB provider AI billing env or server dependencies', () => {
  const currentTestSource = read('tests/customerAccess/customerAccessContextSourceBoundary.static.test.js');
  const contextFiles = [
    FILES.requestContextResolver,
    FILES.contextProvider,
    FILES.contextMiddleware,
    FILES.httpContextAdapter,
    FILES.resolver,
  ];
  const allowedSpecifiersByFile = Object.freeze({
    [FILES.requestContextResolver]: [],
    [FILES.contextProvider]: ['./customerIdentityLinkResolver'],
    [FILES.contextMiddleware]: [
      './customerAccessContextProvider',
      './customerAccessReadOnlyRepository',
    ],
    [FILES.httpContextAdapter]: [],
    [FILES.resolver]: [],
  });

  assert.deepEqual(requireSpecifiers(currentTestSource), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);

  for (const file of contextFiles) {
    const source = read(file);
    const specifiers = requireSpecifiers(source);

    assert.deepEqual(specifiers, allowedSpecifiersByFile[file], `${file} imports should stay narrow`);

    assert.doesNotMatch(source, /process\.env|DATABASE_URL|ZEABUR|new Pool|createPool|psql|db:migrate|migration dry-run/i, file);
    assert.doesNotMatch(source, /fetch\(|axios|http\.request|https\.request|app\.listen|express\s*\(|Router\s*\(/i, file);
    assert.doesNotMatch(source, /send(Line|Sms|SMS|Email|Webhook)|OpenAI|RAG|vector|createSettlement|runSettlement/i, file);
  }
});
