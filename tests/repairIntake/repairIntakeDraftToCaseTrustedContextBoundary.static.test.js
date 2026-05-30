'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  requestContextResolver: 'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  routeAdapterContract: 'src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js',
  routeHandlerFactory: 'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  syntheticHandler: 'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
  adminRoute: 'src/routes/repairIntakeDraftToCase.routes.js',
});

const SERVER_OWNED_OVERRIDE_FIELDS = Object.freeze([
  'actorid',
  'actorrole',
  'draftid',
  'organizationid',
  'repairintakedraftid',
  'source',
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

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const paramsStart = source.indexOf('(', start);

  assert.notEqual(paramsStart, -1, `missing function params for ${functionName}`);

  let paramsDepth = 0;
  let paramsEnd = -1;

  for (let index = paramsStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '(') {
      paramsDepth += 1;
    } else if (char === ')') {
      paramsDepth -= 1;

      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }

  assert.notEqual(paramsEnd, -1, `unterminated function params for ${functionName}`);

  const bodyStart = source.indexOf('{', paramsEnd);

  assert.notEqual(bodyStart, -1, `missing function body for ${functionName}`);

  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  assert.fail(`unterminated function ${functionName}`);
}

function constSetBlock(source, constName) {
  const pattern = new RegExp(`const ${constName} = new Set\\(\\[([\\s\\S]*?)\\]\\);`);
  const match = source.match(pattern);

  assert.ok(match, `missing set ${constName}`);

  return match[1];
}

function assertSetHasNormalizedFields(source, constName, expectedFields) {
  const normalizedSetBlock = normalizeField(constSetBlock(source, constName));

  for (const field of expectedFields) {
    assert.equal(
      normalizedSetBlock.includes(field),
      true,
      `${constName} missing normalized server-owned field ${field}`,
    );
  }
}

function assertDoesNotReadBodyServerContext(block, label) {
  for (const forbidden of [
    /requestBody\.organizationId\b/,
    /requestBody\.actorId\b/,
    /requestBody\.actorRole\b/,
    /requestBody\.repairIntakeDraftId\b/,
    /requestBody\.draftId\b/,
    /requestBody\.source\b/,
    /safeInput\.body\.organizationId\b/,
    /safeInput\.body\.actorId\b/,
    /safeInput\.body\.actorRole\b/,
    /safeInput\.body\.repairIntakeDraftId\b/,
    /safeInput\.body\.draftId\b/,
    /safeInput\.body\.source\b/,
    /draftInput\.organizationId\b/,
    /draftInput\.actorId\b/,
    /draftInput\.actorRole\b/,
    /draftInput\.repairIntakeDraftId\b/,
    /draftInput\.draftId\b/,
  ]) {
    assert.doesNotMatch(block, forbidden, `${label} must not read ${forbidden}`);
  }
}

test('Task2194 static guard reads the current trusted-context boundary files', () => {
  for (const relativePath of Object.values(SOURCE_PATHS)) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('resolver keeps repairIntakeDraftId trusted from top-level input only', () => {
  const source = read(SOURCE_PATHS.requestContextResolver);
  const resolver = functionBlock(source, 'resolveRepairIntakeDraftToCaseRequestContext');

  assert.match(
    resolver,
    /const repairIntakeDraftId = safeString\(safeInput\.repairIntakeDraftId\);/,
  );
  assert.match(resolver, /const requestBody = isPlainObject\(safeInput\.requestBody\)/);
  assert.match(resolver, /sanitizeRepairIntakePublicOpenRequestDto\(requestBody\.draftInput \|\| \{\}\)/);
  assert.match(resolver, /delete draftInput\.source;/);
  assertDoesNotReadBodyServerContext(resolver, 'resolver');
});

test('route handler strips body-level server-owned overrides and forwards path draft id as top-level context', () => {
  const source = read(SOURCE_PATHS.routeHandlerFactory);
  const routeShaper = functionBlock(source, 'routeLikeInputFromFutureRouterInput');

  assertSetHasNormalizedFields(source, 'BODY_OVERRIDE_FIELD_NAMES', SERVER_OWNED_OVERRIDE_FIELDS);
  assert.match(routeShaper, /overrideFields: BODY_OVERRIDE_FIELD_NAMES/);
  assert.match(routeShaper, /\brepairIntakeDraftId,\s*\n\s*body: requestBody,/);
  assert.doesNotMatch(routeShaper, /body:\s*\{/);
  assert.doesNotMatch(routeShaper, /repairIntakeDraftId:\s*requestBody\./);
  assertDoesNotReadBodyServerContext(routeShaper, 'route handler shaper');
});

test('route adapter strips body-level overrides before building pre-route request body', () => {
  const source = read(SOURCE_PATHS.routeAdapterContract);
  const routeAdapter = functionBlock(source, 'routeLikeToPreRouteInput');

  assertSetHasNormalizedFields(source, 'BODY_OVERRIDE_FIELD_NAMES', SERVER_OWNED_OVERRIDE_FIELDS);
  assert.match(routeAdapter, /repairIntakeDraftId: safeScalar\(safeInput\.repairIntakeDraftId\)/);
  assert.match(routeAdapter, /requestBody: sanitizeNestedValue\(isPlainObject\(safeInput\.body\)/);
  assert.match(routeAdapter, /overrideFields: BODY_OVERRIDE_FIELD_NAMES/);
  assert.doesNotMatch(routeAdapter, /repairIntakeDraftId:\s*safeScalar\(safeInput\.body\./);
  assertDoesNotReadBodyServerContext(routeAdapter, 'route adapter');
});

test('synthetic service command construction strips nested draftInput.source before controller adapter call', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const adapterInput = functionBlock(source, 'createAdapterInput');

  assert.match(
    adapterInput,
    /const draftInput = sanitizeRepairIntakePublicOpenRequestDto\(safeResult\.draftInput \|\| \{\}\);/,
  );
  assert.match(adapterInput, /delete draftInput\.source;/);
  assert.match(adapterInput, /\bdraftInput,\s*\n\s*\}\);/);
  assert.doesNotMatch(adapterInput, /source:\s*safeString\(safeResult\.draftInput\.source\)/);
  assert.doesNotMatch(adapterInput, /draftInput:\s*safeResult\.draftInput/);
});

test('admin route helper derives organization and draft context from trusted route/user fields only', () => {
  const source = read(SOURCE_PATHS.adminRoute);
  const organizationId = functionBlock(source, 'organizationId');
  const draftId = functionBlock(source, 'draftId');
  const bodyScrubber = functionBlock(source, 'bodyWithoutServerOwnedContext');
  const requestBuilder = functionBlock(source, 'buildAdminRequestLike');

  assert.doesNotMatch(organizationId, /body\.organizationId\b/);
  assert.doesNotMatch(draftId, /body\.draftId\b/);
  assert.doesNotMatch(draftId, /body\.repairIntakeDraftId\b/);

  for (const field of SERVER_OWNED_OVERRIDE_FIELDS) {
    assert.equal(
      normalizeField(bodyScrubber).includes(field),
      true,
      `admin body scrubber missing ${field}`,
    );
  }

  assert.match(requestBuilder, /const requestBody = bodyWithoutServerOwnedContext\(body\);/);
  assert.match(requestBuilder, /repairIntakeDraftId: resolvedDraftId/);
  assert.match(requestBuilder, /\.\.\.requestBody/);
  assert.doesNotMatch(requestBuilder, /\.\.\.body/);
  assert.doesNotMatch(requestBuilder, /resolvedOrganizationId = .*body\.organizationId/);
  assert.doesNotMatch(requestBuilder, /resolvedDraftId = .*body\.draftId/);
  assert.doesNotMatch(requestBuilder, /resolvedDraftId = .*body\.repairIntakeDraftId/);
});
