'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const PACKET_PATH = 'docs/task-2369-repair-intake-draft-to-case-admin-route-rollout-authorization-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md';

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
});

const DOC_PATHS = Object.freeze({
  task2338: 'docs/task-2338-repair-intake-migration-026-disposable-db-dry-run-authorization-packet-no-db-execution-no-migration-apply-no-smoke-no-provider.md',
  task2340: 'docs/task-2340-repair-intake-migration-026-disposable-db-dry-run-blocked-checkpoint-no-db-execution-no-migration-no-smoke-no-provider.md',
  task2341: 'docs/task-2341-repair-intake-draft-to-case-db-backed-fake-synthetic-portfolio-static-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md',
  task2354: 'docs/task-2354-repair-intake-draft-to-case-production-auth-session-implementation-authorization-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2363: 'docs/task-2363-repair-intake-draft-to-case-admin-route-composition-portfolio-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2365: 'docs/task-2365-repair-intake-draft-to-case-admin-route-auth-failure-synthetic-matrix-no-source-change-no-db-no-smoke-no-provider-no-package.md',
  task2367: 'docs/task-2367-repair-intake-draft-to-case-admin-route-composition-synthetic-verification-branch-closure-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2368: 'docs/task-2368-repair-intake-draft-to-case-admin-route-production-readiness-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

const ADJACENT_TESTS = Object.freeze([
  'tests/repairIntake/repairIntakeDraftToCaseAdminRouteProductionReadinessPacket.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionRouteExposureDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionImplementationAuthorization.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbBackedFakeSyntheticPortfolio.static.test.js',
  'tests/repairIntake/repairIntakeMigration026DisposableDbDryRunAuthorization.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseSmokeStagingRolloutAuthorizationGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionPortfolio.static.test.js',
]);

const PUBLIC_OPEN_ROUTE_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

const EXECUTABLE_AUTHORIZATION_PATTERNS = Object.freeze([
  new RegExp('\\bcurl\\s+', 'i'),
  new RegExp('\\bfet' + 'ch\\s*\\('),
  new RegExp('\\bsuper' + 'test\\s*\\('),
  new RegExp('\\bapp\\.lis' + 'ten\\s*\\('),
  new RegExp('\\bserver\\.lis' + 'ten\\s*\\('),
  new RegExp('\\blis' + 'ten\\s*\\('),
  new RegExp('/hea' + 'lthz', 'i'),
  new RegExp('\\bps' + 'ql\\s+', 'i'),
  new RegExp('\\bdb:mig' + 'rate\\b', 'i'),
  new RegExp('\\bDATA' + 'BASE_URL\\s*='),
]);

const REAL_LOOKING_SECRET_PATTERNS = Object.freeze([
  /postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@[^/\s]+\/[^\s)]+/i,
  /\b[a-z][a-z0-9_]*:\/\/[^@\s]+:[^@\s]+@/i,
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9._~+/=-]{12,}/i,
  /\b(?:DATABASE_URL|POSTGRES_URL|POSTGRES_PASSWORD|PGPASSWORD)\s*[:=]\s*['"]?[^'"\s]+/i,
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const signatureEnd = source.indexOf(') {', start);

  assert.notEqual(signatureEnd, -1, `missing function body ${functionName}`);

  const bodyStart = source.indexOf('{', signatureEnd);
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

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = Object.freeze([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated ${constName}`);

  return `${source.slice(0, start)}${source.slice(end + 4)}`;
}

function sourceWithoutAllowedLists(source) {
  return [
    'PUBLIC_OPEN_ROUTE_MARKERS',
    'EXECUTABLE_AUTHORIZATION_PATTERNS',
    'REAL_LOOKING_SECRET_PATTERNS',
  ].reduce((result, constName) => stripConstArrayBlock(result, constName), source);
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} should not include ${marker}`);
  }
}

function assertDoesNotMatchAny(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not match ${pattern}`);
  }
}

test('Task2369 rollout authorization packet and source-reading inputs exist', () => {
  for (const relativePath of [
    PACKET_PATH,
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...ADJACENT_TESTS,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAdminRouteRolloutAuthorizationPacket.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('route path admin injected permission and auth session route wiring markers remain visible', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'registerRepairIntakeDraftToCaseAdminRoutes',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
  ], 'admin route rollout authorization markers');

  assertIncludesAll(buildAdminRequestLike, [
    'bodyWithoutServerOwnedContext(body)',
    'buildRepairIntakeDraftToCaseAuthSessionContext({',
    'normalizeRepairIntakeDraftToCaseTrustedContext({',
    'context: authSessionContext',
    'sessionContext: authSessionContext',
  ], 'auth session trusted context route wiring');

  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'admin route public/open/customer expansion');
});

test('request abuse guard remains in API module before controller invocation', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const callSafeController = functionBlock(apiModule, 'callSafeController');

  assertIncludesAll(apiModule, [
    "require('./repairIntakeDraftToCaseRequestAbuseGuard')",
    'guardRepairIntakeDraftToCaseRequest(requestLike)',
    'safeControllerFailure(',
    'sanitizeRequestInput(requestLike)',
  ], 'API module request abuse guard rollout markers');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );
});

test('rollout authorization packet records readiness blockers requirements stop conditions and rollback', () => {
  const packet = read(PACKET_PATH);

  assertIncludesAll(packet, [
    'Current accepted route readiness',
    'Route path remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.',
    'Route remains admin/injected-only.',
    '`requirePermission` / `cases.create` remains present.',
    'Auth/session context adapter and trusted context normalizer are wired at the route request-like boundary.',
    'Request abuse guard is in the API module before controller invocation.',
    'Fake-router route composition passed.',
    'Auth-failure synthetic matrix passed.',
    'DB-backed fake/synthetic persistence chain with audit passed.',
    'Migration 026 dry-run remains blocked due no disposable local/test DB tooling.',
    'Future rollout blockers',
    'No disposable DB migration 026 dry-run completed.',
    'No real DB/staging/prod DB authorization.',
    'No smoke/endpoint authorization.',
    'No production/staging env/Zeabur verification.',
    'Provider sending remains unauthorized.',
    'Public/open route remains unauthorized.',
    'Future rollout authorization requirements',
    'Exact environment target by name.',
    'DB target and migration state explicitly authorized.',
    'Secrets/env handling plan that forbids printing credentials, database URLs, or secret values.',
    'Endpoint/smoke probes explicitly scoped by method, path, auth/session source, fixture, and expected safe envelope.',
    'Expected success response:',
    'Expected safe failure response:',
    'Stop conditions',
    'Rollback and revert requirements',
    'Provider sending disabled unless separately authorized.',
  ], 'Task2369 rollout authorization packet');
});

test('packet keeps production rollout DB migration smoke env and provider work non-authorized', () => {
  const docs = Object.values(DOC_PATHS).map(read).join('\n');
  const packet = read(PACKET_PATH);

  assertIncludesAll(docs, [
    'DB-backed fake/synthetic',
    'audit persistence fake-client',
    'BLOCKED: no disposable DB target available',
    'Task2338 does not authorize DB execution',
    'production auth/session implementation',
    'admin route composition portfolio static guard',
    'auth-failure synthetic matrix',
    'synthetic verification branch is closed for this phase',
    'Route rollout authorization packet',
  ], 'rollout authorization evidence docs');

  assertIncludesAll(packet, [
    'This is docs/static-only.',
    'does not authorize server/listener startup',
    'does not authorize server/listener startup, smoke execution, endpoint probes, env/Zeabur/secrets inspection, DB execution',
    'DB/migration/smoke/env/provider work remains non-authorized.',
    'Migration 026 dry-run blocked status remains visible.',
    'Do not recommend immediate smoke execution unless all blockers are explicitly satisfied by a separate PM-authorized task.',
  ], 'Task2369 non-authorization packet');
});

test('packet contains exact stop conditions and rollback or revert requirements', () => {
  const packet = read(PACKET_PATH);

  assertIncludesAll(packet, [
    'Environment target ambiguity.',
    'DB/migration state ambiguity.',
    'Missing auth/session context.',
    'Permission failure ambiguity.',
    'Unexpected route path/mount behavior.',
    'Any need to print secrets or `DATABASE_URL`.',
    'Any provider sending requirement.',
    'Any production/staging traffic not explicitly authorized.',
    'Which branch, commit, or deployment artifact can be restored.',
    'Which feature flag or route enablement setting can be disabled.',
    'How DB migration state will be handled if migration work is authorized separately.',
    'Who confirms rollback completion.',
    'Which evidence can be collected without printing secrets.',
  ], 'Task2369 stop conditions and rollback requirements');
});

test('packet recommends one next bounded task without immediate smoke execution', () => {
  const packet = read(PACKET_PATH);
  const recommendedTaskMatches = packet.match(/Recommended next exact bounded task:/g) || [];

  assert.equal(recommendedTaskMatches.length, 1, 'packet must recommend exactly one next bounded task');
  assertIncludesAll(packet, [
    'Recommended next exact bounded task: production rollout static readiness portfolio guard.',
    'A static readiness portfolio guard can consolidate the accepted readiness, blockers, and authorization requirements without executing runtime work.',
    'Do not recommend immediate smoke execution unless all blockers are explicitly satisfied by a separate PM-authorized task.',
  ], 'Task2369 next bounded task');
});

test('packet and guard do not introduce executable endpoint smoke server DB authorization or credentials', () => {
  const packet = read(PACKET_PATH);
  const guardSource = sourceWithoutAllowedLists(read('tests/repairIntake/repairIntakeDraftToCaseAdminRouteRolloutAuthorizationPacket.static.test.js'));

  assertDoesNotMatchAny(packet, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2369 packet executable authorization');
  assertDoesNotMatchAny(guardSource, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2369 guard executable authorization');
  assertDoesNotMatchAny(packet, REAL_LOOKING_SECRET_PATTERNS, 'Task2369 packet credential boundary');
  assertDoesNotMatchAny(guardSource, REAL_LOOKING_SECRET_PATTERNS, 'Task2369 guard credential boundary');
});
