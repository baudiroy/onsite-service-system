'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2370_DOC_PATH = 'docs/task-2370-repair-intake-draft-to-case-admin-route-rollout-readiness-portfolio-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md';

const SOURCE_PATHS = Object.freeze({
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
});

const DOC_PATHS = Object.freeze({
  task2340: 'docs/task-2340-repair-intake-migration-026-disposable-db-dry-run-blocked-checkpoint-no-db-execution-no-migration-no-smoke-no-provider.md',
  task2341: 'docs/task-2341-repair-intake-draft-to-case-db-backed-fake-synthetic-portfolio-static-guard-no-runtime-change-no-db-execution-no-migration-no-smoke-no-provider.md',
  task2363: 'docs/task-2363-repair-intake-draft-to-case-admin-route-composition-portfolio-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2367: 'docs/task-2367-repair-intake-draft-to-case-admin-route-composition-synthetic-verification-branch-closure-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2368: 'docs/task-2368-repair-intake-draft-to-case-admin-route-production-readiness-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
  task2369: 'docs/task-2369-repair-intake-draft-to-case-admin-route-rollout-authorization-packet-no-runtime-change-no-db-no-smoke-no-provider-no-package.md',
});

const TEST_PATHS = Object.freeze({
  task2341: 'tests/repairIntake/repairIntakeDraftToCaseDbBackedFakeSyntheticPortfolio.static.test.js',
  task2363: 'tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionPortfolio.static.test.js',
  task2368: 'tests/repairIntake/repairIntakeDraftToCaseAdminRouteProductionReadinessPacket.static.test.js',
  task2369: 'tests/repairIntake/repairIntakeDraftToCaseAdminRouteRolloutAuthorizationPacket.static.test.js',
});

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

test('Task2370 portfolio guard reads source test and doc artifacts as text only', () => {
  for (const relativePath of [
    TASK2370_DOC_PATH,
    ...Object.values(SOURCE_PATHS),
    ...Object.values(DOC_PATHS),
    ...Object.values(TEST_PATHS),
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  const guardSource = read('tests/repairIntake/repairIntakeDraftToCaseAdminRouteRolloutReadinessPortfolio.static.test.js');
  const topLevelImports = guardSource.split('\n').slice(0, 8).join('\n');

  assert.deepEqual(requireSpecifiers(topLevelImports).sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('accepted rollout readiness portfolio artifacts remain visible', () => {
  const docs = Object.values(DOC_PATHS).map(read).join('\n');
  const tests = Object.values(TEST_PATHS).map(read).join('\n');
  const task2370 = read(TASK2370_DOC_PATH);

  assertIncludesAll(docs, [
    'Task2368 Repair Intake Draft-to-Case Admin Route Production Readiness Packet',
    'Task2369 Repair Intake Draft-to-Case Admin Route Rollout Authorization Packet',
    'Task2341 Repair Intake Draft-to-Case DB-Backed Fake Synthetic Portfolio Static Guard',
    'Task2340 Repair Intake Migration 026 Disposable DB Dry-Run Blocked Checkpoint',
    'Task2363 Repair Intake Draft-to-Case Admin Route Composition Portfolio Static Guard',
    'Task2367 Repair Intake Draft-to-Case Admin Route Composition Synthetic Verification Branch Closure',
  ], 'accepted rollout readiness docs');

  assertIncludesAll(tests, [
    'repairIntakeDraftToCaseDbBackedFakeSyntheticPortfolio',
    'repairIntakeDraftToCaseAdminRouteCompositionPortfolio',
    'repairIntakeDraftToCaseAdminRouteProductionReadinessPacket',
    'repairIntakeDraftToCaseAdminRouteRolloutAuthorizationPacket',
  ], 'accepted rollout readiness tests');

  assertIncludesAll(task2370, [
    'Task2368 production readiness packet.',
    'Task2369 rollout authorization packet.',
    'Task2341 DB-backed fake/synthetic portfolio guard.',
    'Task2340 migration 026 dry-run blocked checkpoint.',
    'Task2363 admin route composition portfolio guard.',
    'Task2367 admin route composition synthetic verification branch closure.',
  ], 'Task2370 portfolio coverage doc');
});

test('route readiness state remains admin injected permission gated and source-only', () => {
  const routeSource = read(SOURCE_PATHS.route);
  const apiModule = read(SOURCE_PATHS.apiModule);
  const buildAdminRequestLike = functionBlock(routeSource, 'buildAdminRequestLike');
  const callSafeController = functionBlock(apiModule, 'callSafeController');
  const docs = [
    read(DOC_PATHS.task2368),
    read(DOC_PATHS.task2369),
    read(DOC_PATHS.task2363),
    read(DOC_PATHS.task2367),
    read(TASK2370_DOC_PATH),
  ].join('\n');

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    'registerRepairIntakeDraftToCaseAdminRoutes',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
  ], 'admin route readiness source');

  assertIncludesAll(buildAdminRequestLike, [
    'buildRepairIntakeDraftToCaseAuthSessionContext({',
    'normalizeRepairIntakeDraftToCaseTrustedContext({',
    'context: authSessionContext',
    'sessionContext: authSessionContext',
  ], 'auth/session route request-like boundary');

  assert.ok(
    callSafeController.indexOf('guardRepairIntakeDraftToCaseRequest(requestLike)')
      < callSafeController.indexOf('method.call('),
    'request abuse guard must remain before controller invocation',
  );

  assertIncludesAll(docs, [
    'Route path remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.',
    'Route remains admin/injected-only.',
    '`requirePermission` / `cases.create` remains visible.',
    'Auth/session context adapter and trusted context normalizer are wired at the route request-like boundary.',
    'Request abuse guard remains in the API module before controller invocation.',
    'Fake-router route composition passed.',
    'Auth-failure synthetic matrix passed.',
    'DB-backed fake/synthetic persistence chain with audit passed.',
  ], 'portfolio route readiness docs');

  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'admin route public/open/customer expansion');
});

test('rollout blockers remain visible and prevent runtime authorization drift', () => {
  const docs = [
    read(DOC_PATHS.task2340),
    read(DOC_PATHS.task2341),
    read(DOC_PATHS.task2368),
    read(DOC_PATHS.task2369),
    read(TASK2370_DOC_PATH),
  ].join('\n');

  assertIncludesAll(docs, [
    'No disposable DB migration 026 dry-run completed.',
    'Migration 026 dry-run remains blocked due no disposable local/test DB tooling.',
    'Result: `BLOCKED: no disposable DB target available`.',
    'No real DB/staging/prod DB authorization',
    'No smoke/endpoint authorization.',
    'No production/staging env/Zeabur verification.',
    'Provider sending remains unauthorized.',
    'Public/open route remains unauthorized.',
    'Task2370 keeps rollout non-authorized.',
  ], 'rollout blockers and non-authorization');
});

test('future rollout requirements stop conditions and rollback requirements remain visible', () => {
  const docs = [
    read(DOC_PATHS.task2369),
    read(TASK2370_DOC_PATH),
  ].join('\n');

  assertIncludesAll(docs, [
    'Exact environment target by name.',
    'DB target and migration state explicitly authorized.',
    'Secrets/env handling plan that forbids printing credentials, database URLs, or secret values.',
    'Server/listener/deploy authorization, if needed, as an explicit scope item.',
    'Endpoint/smoke probes explicitly scoped by method, path, auth/session source, fixture, and expected safe envelope.',
    'Environment target ambiguity.',
    'DB/migration state ambiguity.',
    'Missing auth/session context.',
    'Permission failure ambiguity.',
    'Unexpected route path/mount behavior.',
    'Any need to print secrets or `DATABASE_URL`.',
    'Any provider sending requirement.',
    'Any production/staging traffic not explicitly authorized.',
    'Rollback/revert plan.',
    'Which branch, commit, or deployment artifact can be restored.',
  ], 'future rollout requirements stop conditions rollback');
});

test('forbidden executable authorization credential provider package and route expansion remain absent', () => {
  const task2370 = read(TASK2370_DOC_PATH);
  const guardSource = sourceWithoutAllowedLists(read('tests/repairIntake/repairIntakeDraftToCaseAdminRouteRolloutReadinessPortfolio.static.test.js'));
  const routeSource = read(SOURCE_PATHS.route);

  assertIncludesAll(task2370, [
    'Endpoint/smoke/server command strings as executable authorization.',
    'Real-looking database URL or credential.',
    '`DATABASE_URL`, env, Zeabur, or secrets inspection.',
    'Provider sending.',
    'Package dependency expansion.',
    'Route path or mount change.',
    'Public/open/customer route expansion.',
  ], 'Task2370 forbidden scope doc');

  assertDoesNotMatchAny(task2370, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2370 doc executable authorization');
  assertDoesNotMatchAny(guardSource, EXECUTABLE_AUTHORIZATION_PATTERNS, 'Task2370 guard executable authorization');
  assertDoesNotMatchAny(task2370, REAL_LOOKING_SECRET_PATTERNS, 'Task2370 doc credential boundary');
  assertDoesNotMatchAny(guardSource, REAL_LOOKING_SECRET_PATTERNS, 'Task2370 guard credential boundary');
  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'admin route public/open/customer route expansion');
});
