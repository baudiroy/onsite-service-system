'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  routes: 'src/routes/customerAccessRoutes.js',
  controller: 'src/controllers/customerAccessController.js',
  service: 'src/customerAccess/customerAccessService.js',
  envelope: 'src/customerAccess/customerAccessResponseEnvelope.js',
  resolver: 'src/customerAccess/customerAccessResolver.js',
  facade: 'src/customerAccess/customerAccessFacade.js',
  task2308: 'docs/task-2308-customer-access-case-summary-safe-envelope-runtime-boundary-inventory-no-db-no-smoke-no-provider.md',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

function disallowedRuntimeDependencySpecifiers(source) {
  return requireSpecifiers(source).filter((specifier) => (
    /(?:^|\/)(?:db|database|provider|openai|rag|billing|settlement|migration|smoke|server|app|env)(?:$|[A-Z._/-])/i
      .test(specifier) ||
    /Repository/.test(specifier)
  ));
}

function functionSource(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  const end = nextFunctionName
    ? source.indexOf(`function ${nextFunctionName}`, start + 1)
    : -1;

  assert.notEqual(start, -1, `${functionName} should exist`);

  return source.slice(start, end === -1 ? undefined : end);
}

test('Task2308 case summary inventory guard source files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('GET /customer-access/:caseId routes to the case-level controller boundary', () => {
  const routes = read(FILES.routes);

  assert.match(routes, /const CUSTOMER_ACCESS_ROUTE_PATH = '\/customer-access\/:caseId';/);
  assert.match(routes, /registerGet\.call\(router,\s*CUSTOMER_ACCESS_ROUTE_PATH,\s*customerAccessContextMiddleware,\s*handleCustomerAccessRequest\)/);
  assert.match(routes, /handleCustomerAccessRequest,\s*\n\s*\} = require\('\.\.\/controllers\/customerAccessController'\);/);
});

test('case-level controller owns current response shaping and safe-deny boundary', () => {
  const controller = read(FILES.controller);
  const overviewInput = functionSource(
    controller,
    'buildCustomerAccessOverviewInput',
    'buildCustomerAccessControllerResponse',
  );
  const responseBoundary = functionSource(
    controller,
    'buildCustomerAccessControllerResponseWithOptions',
    'safeAuditIdentifierFromAuth',
  );
  const facadeEnvelope = functionSource(
    controller,
    'safeEnvelopeFromFacadeResult',
    'sanitizedCustomerAccessContextFromRequest',
  );
  const allowEnvelope = functionSource(
    controller,
    'safeAllowEnvelopeFromFacadeResult',
    'safeEnvelopeFromFacadeResult',
  );

  assert.match(overviewInput, /caseId/);
  assert.match(overviewInput, /customerAccessContext/);
  assert.match(responseBoundary, /buildCustomerAccessHttpResponse/);
  assert.match(responseBoundary, /safeEnvelopeFromFacadeResult\(facadeResult\)/);
  assert.match(responseBoundary, /return safeDenyEnvelope\(\);/);
  assert.match(facadeEnvelope, /safeAllowEnvelopeFromFacadeResult\(facadeResult\)/);
  assert.match(facadeEnvelope, /return safeDenyEnvelope\(\);/);
  assert.match(allowEnvelope, /allowlistedServiceReport/);
  assert.match(allowEnvelope, /data:\s*\{\s*serviceReport,\s*\}/);
});

test('current case overview response shape and service report keys are explicit', () => {
  const controller = read(FILES.controller);
  const envelope = read(FILES.envelope);

  for (const key of [
    'status',
    'messageKey',
    'customerVisible',
    'data',
    'serviceReport',
    'caseNo',
    'finalAppointmentId',
    'publicReportId',
    'summary',
  ]) {
    assert.match(`${controller}\n${envelope}`, new RegExp(key), `${key} should remain visible`);
  }

  assert.match(controller, /const SAFE_ALLOW_MESSAGE_KEY = 'customerAccess\.available';/);
  assert.match(controller, /const SERVICE_REPORT_RESPONSE_KEYS = Object\.freeze\(\[/);
  assert.match(envelope, /const ALLOW_MESSAGE_KEY = 'customerAccess\.available';/);
});

test('safe-deny and generic unavailable markers remain visible', () => {
  const controller = read(FILES.controller);
  const service = read(FILES.service);
  const envelope = read(FILES.envelope);
  const resolver = read(FILES.resolver);

  assert.match(controller, /customerAccess\.unavailable/);
  assert.match(controller, /function safeDenyEnvelope\(\)/);
  assert.match(service, /if \(!decision\.allowed\) \{\s*return buildCustomerAccessEnvelope\(\{ decision \}\);\s*\}/);
  assert.match(envelope, /function buildCustomerAccessDenyEnvelope\(\)/);
  assert.match(resolver, /const GENERIC_DENY_MESSAGE_KEY = 'customerAccess\.unavailable';/);
});

test('known case-level response construction does not directly expose raw object containers', () => {
  const controller = read(FILES.controller);
  const envelope = read(FILES.envelope);
  const allowEnvelope = functionSource(
    controller,
    'safeAllowEnvelopeFromFacadeResult',
    'safeEnvelopeFromFacadeResult',
  );
  const responseEnvelope = functionSource(
    envelope,
    'buildCustomerAccessAllowEnvelope',
    'buildCustomerAccessEnvelope',
  );
  const responseConstruction = [
    allowEnvelope,
    responseEnvelope,
  ].join('\n');

  assert.doesNotMatch(responseConstruction, /\.\.\.\s*(?:facadeResult|data|serviceReport|candidate|input|row|projection)/);
  assert.doesNotMatch(responseConstruction, /rawCase|rawAppointment|rawCompletionReport|rawFieldServiceReport|repositoryRow|dbRow|providerPayload|aiRawPayload|billingInternalData|debug|token|password|secret/);
  assert.match(controller, /allowlistedServiceReport\(safeProperty\(data,\s*'serviceReport'\)\)/);
  assert.match(envelope, /sanitizeCustomerVisibleData\(data\)/);
});

test('case-level boundary path has no direct DB provider AI billing env server or smoke dependencies', () => {
  for (const [file, source] of [
    [FILES.controller, read(FILES.controller)],
    [FILES.service, read(FILES.service)],
    [FILES.envelope, read(FILES.envelope)],
    [FILES.facade, read(FILES.facade)],
  ]) {
    assert.deepEqual(disallowedRuntimeDependencySpecifiers(source), [], file);
    assert.doesNotMatch(source, /process\.env|DATABASE_URL|Zeabur|new Pool|createPool|\.query\s*\(|fetch\s*\(|axios|http\.request|https\.request|listen\s*\(|app\.listen|provider sending|send(Line|Sms|SMS|Email|Webhook)|new OpenAI\(|create.*Rag|create.*Billing|create.*Settlement|create.*Payment|create.*Invoice/i, file);
  }
});

test('Task2308 doc records exact candidate boundary and helper reuse decision', () => {
  const doc = read(FILES.task2308);

  assert.match(doc, /case-level Customer Access runtime response boundary exists/);
  assert.match(doc, /src\/controllers\/customerAccessController\.js/);
  assert.match(doc, /safeEnvelopeFromFacadeResult\(facadeResult\)/);
  assert.match(doc, /safeAllowEnvelopeFromFacadeResult\(facadeResult\)/);
  assert.match(doc, /new pure case summary envelope helper is needed first/);
});
