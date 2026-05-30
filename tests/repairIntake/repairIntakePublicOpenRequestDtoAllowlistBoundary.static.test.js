'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  publicResultPresenter: 'src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js',
  requestContextResolver: 'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  routeHandlerFactory: 'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  routeFile: 'src/routes/repairIntakeDraftToCase.routes.js',
  syntheticHandler: 'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
});

const ABSENT_PUBLIC_OPEN_DIRS = Object.freeze([
  'src/openRepairIntake',
  'tests/openRepairIntake',
]);

const REQUEST_SHAPING_FILES = Object.freeze([
  SOURCE_PATHS.apiModule,
  SOURCE_PATHS.requestContextResolver,
  SOURCE_PATHS.routeHandlerFactory,
  SOURCE_PATHS.syntheticHandler,
]);

const CLIENT_CONTROLLED_SYSTEM_FIELDS = Object.freeze([
  'organizationId',
  'caseId',
  'appointmentId',
  'completionReportId',
  'finalAppointmentId',
  'status',
  'createdBy',
  'updatedBy',
  'assignedEngineerId',
  'provider',
  'ai',
  'billing',
  'audit',
  'auditOwnerId',
  'auditOrganizationId',
]);

const RAW_IDENTITY_FIELDS = Object.freeze([
  'address',
  'customerAddress',
  'customerName',
  'customerPhone',
  'email',
  'lineAccessToken',
  'lineUserId',
  'phone',
  'privateNotes',
  'providerPayload',
  'raw',
  'rawBody',
  'sql',
  'token',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function normalizeField(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function sourceWithoutConstCollections(source) {
  return source
    .replace(/const [A-Z0-9_]+ = new Set\(\[[\s\S]*?\]\);/g, '')
    .replace(/const [A-Z0-9_]+ = Object\.freeze\(\[[\s\S]*?\]\);/g, '')
    .replace(/const [A-Z0-9_]+ = \[[\s\S]*?\];/g, '');
}

function assertIncludes(source, marker, label) {
  assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
}

test('Task2188 public/open intake guard targets current Repair Intake surface only', () => {
  for (const relativePath of Object.values(SOURCE_PATHS)) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  for (const relativePath of ABSENT_PUBLIC_OPEN_DIRS) {
    assert.equal(fs.existsSync(projectPath(relativePath)), false, `${relativePath} is not active yet`);
  }
});

test('request shaping files keep explicit sanitizer and override-deny markers', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const routeHandlerFactory = read(SOURCE_PATHS.routeHandlerFactory);
  const requestContextResolver = read(SOURCE_PATHS.requestContextResolver);
  const syntheticHandler = read(SOURCE_PATHS.syntheticHandler);

  for (const marker of [
    'SAFE_REQUEST_INPUT_FIELDS',
    'UNSAFE_REQUEST_FIELD_NAMES',
    'sanitizeRequestInput',
    'sanitizeRequestValue',
    'requestFieldIsUnsafe',
  ]) {
    assertIncludes(apiModule, marker, SOURCE_PATHS.apiModule);
  }

  for (const marker of [
    'BODY_OVERRIDE_FIELD_NAMES',
    'sanitizeNestedValue',
    'routeLikeInputFromFutureRouterInput',
    'overrideFields: BODY_OVERRIDE_FIELD_NAMES',
  ]) {
    assertIncludes(routeHandlerFactory, marker, SOURCE_PATHS.routeHandlerFactory);
  }

  for (const marker of [
    'BODY_OVERRIDE_FIELD_NAMES',
    'bodyFieldIsUnsafe',
    'safeObject(requestBody.draftInput, bodyFieldIsUnsafe)',
    'resolveRepairIntakeDraftToCaseRequestContext',
  ]) {
    assertIncludes(requestContextResolver, marker, SOURCE_PATHS.requestContextResolver);
  }

  for (const marker of [
    'UNSAFE_FIELD_NAMES',
    'sanitizeNestedValue',
    'safeObject',
    'createAdapterInput',
  ]) {
    assertIncludes(syntheticHandler, marker, SOURCE_PATHS.syntheticHandler);
  }
});

test('request shaping files do not spread raw request bodies or raw input into downstream payloads', () => {
  for (const relativePath of REQUEST_SHAPING_FILES) {
    const source = sourceWithoutConstCollections(read(relativePath));

    for (const forbidden of [
      /\.\.\.\s*req\.body\b/,
      /\.\.\.\s*request\.body\b/,
      /\.\.\.\s*requestLike\.body\b/,
      /\.\.\.\s*input\.body\b/,
      /\.\.\.\s*safeInput\.body\b/,
      /\.\.\.\s*rawInput\b/,
      /\.\.\.\s*rawRequest\b/,
      /\.\.\.\s*handlerInput\b/,
      /Object\.assign\(\s*\{\s*\}\s*,\s*(req\.body|request\.body|input\.body|safeInput\.body|handlerInput)\s*\)/,
    ]) {
      assert.doesNotMatch(source, forbidden, `${relativePath} matched forbidden raw pass-through ${forbidden}`);
    }
  }
});

test('client-controlled system fields stay denylisted before public/open DTO expansion', () => {
  const sources = {
    apiModule: read(SOURCE_PATHS.apiModule),
    routeHandlerFactory: read(SOURCE_PATHS.routeHandlerFactory),
    requestContextResolver: read(SOURCE_PATHS.requestContextResolver),
    syntheticHandler: read(SOURCE_PATHS.syntheticHandler),
  };

  assert.match(sources.routeHandlerFactory, /const BODY_OVERRIDE_FIELD_NAMES = new Set\(\[[\s\S]*'organizationid'[\s\S]*\]\);/);
  assert.match(sources.requestContextResolver, /const BODY_OVERRIDE_FIELD_NAMES = new Set\(\[[\s\S]*'organizationid'[\s\S]*\]\);/);

  const denylistSources = [
    sources.apiModule,
    sources.routeHandlerFactory,
    sources.requestContextResolver,
    sources.syntheticHandler,
  ].join('\n');

  for (const field of CLIENT_CONTROLLED_SYSTEM_FIELDS) {
    const normalized = normalizeField(field);
    const fieldPattern = new RegExp(`['\"]${normalized}['\"]|['\"]${field}['\"]`, 'i');

    if (['organizationid', 'audit'].includes(normalized)) {
      if (normalized === 'audit') {
        assert.match(
          denylistSources,
          /['"]auditrecord['"]|['"]auditownerid['"]|['"]auditorganizationid['"]/i,
          `${field} ownership should be represented in a deny/override guard`,
        );
        continue;
      }

      assert.match(denylistSources, fieldPattern, `${field} should be represented in a deny/override guard`);
    }
  }

  const presenterSource = read(SOURCE_PATHS.publicResultPresenter);

  for (const field of CLIENT_CONTROLLED_SYSTEM_FIELDS) {
    if (['caseId', 'status'].includes(field)) {
      continue;
    }

    assert.doesNotMatch(
      presenterSource,
      new RegExp(`(^|[^A-Za-z0-9_])${field}([^A-Za-z0-9_]|$)`),
      `public presenter must not expose client-controlled system field ${field}`,
    );
  }
});

test('public result presenter remains a small output allowlist without raw identity or contact fields', () => {
  const presenterSource = read(SOURCE_PATHS.publicResultPresenter);

  for (const allowedMarker of [
    'ok',
    'status',
    'messageKey',
    'reasonCode',
    'caseId',
    'repairIntakeDraftId',
  ]) {
    assertIncludes(presenterSource, allowedMarker, SOURCE_PATHS.publicResultPresenter);
  }

  for (const rawField of RAW_IDENTITY_FIELDS) {
    assert.equal(
      presenterSource.toLowerCase().includes(rawField.toLowerCase()),
      false,
      `public presenter must not expose ${rawField}`,
    );
  }
});

test('current Repair Intake route surface does not add public/open route expansion in this guard', () => {
  const routeSource = read(SOURCE_PATHS.routeFile);

  assertIncludes(routeSource, 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH', SOURCE_PATHS.routeFile);
  assertIncludes(routeSource, 'registerRepairIntakeDraftToCaseAdminRoutes', SOURCE_PATHS.routeFile);
  assert.equal(routeSource.includes('openRepairIntake'), false);
  assert.equal(routeSource.includes('publicOpenIntake'), false);
  assert.equal(routeSource.includes('createOpenRepairIntake'), false);
  assert.equal(routeSource.includes("require('../app')"), false);
  assert.equal(routeSource.includes("require('../server')"), false);
  assert.equal(routeSource.includes("require('../providers')"), false);
  assert.equal(routeSource.includes("require('pg')"), false);
});
