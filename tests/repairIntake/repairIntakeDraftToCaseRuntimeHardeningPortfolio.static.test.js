'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const ROUTE_PATH = 'src/routes/repairIntakeDraftToCase.routes.js';
const OPEN_REPAIR_INTAKE_SOURCE_DIR = 'src/openRepairIntake';
const OPEN_REPAIR_INTAKE_TEST_DIR = 'tests/openRepairIntake';
const CONTROLLERS_DIR = 'src/controllers';

const SOURCE_PATHS = Object.freeze([
  'src/repairIntake/repairIntakePublicOpenRequestDtoSanitizer.js',
  'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  'src/repairIntake/repairIntakeDraftToCasePermissionGate.js',
  'src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.js',
  'src/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder.js',
  'src/repairIntake/repairIntakeAuditWriterPortAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js',
  'src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js',
  ROUTE_PATH,
]);

const GUARD_PATHS = Object.freeze([
  'tests/repairIntake/repairIntakeDraftToCaseRequestContextResolverBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseTrustedContextBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseServiceBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCasePermissionGateWiring.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseSafeAuditContextPropagation.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseApplicationServiceInjectedPortFailureBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseControllerAdapterFailureBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseApiModuleSafeControllerFailureBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRouteAdapterHandlerFailureBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseHttpEnvelopeMapperFailureBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCasePublicSuccessEnvelopeFinalAllowlist.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAdminRouteComposition.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAdminRouteSafeError.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionRouteExposureDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseAuditPersistenceDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbRepositoryTransactionBoundaryDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractBoundary.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseRateLimitPayloadSizeReadinessDecisionGate.static.test.js',
  'tests/repairIntake/repairIntakeDraftToCaseSmokeStagingRolloutAuthorizationGate.static.test.js',
]);

const CHECKPOINT_DOC_PATHS = Object.freeze([
  'docs/task-2202-repair-intake-draft-to-case-runtime-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2216-repair-intake-draft-to-case-admin-route-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2221-repair-intake-draft-to-case-persistence-readiness-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2225-repair-intake-draft-to-case-readiness-decision-gates-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2234-repair-intake-draft-to-case-api-controller-boundary-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2237-repair-intake-draft-to-case-route-adapter-handler-boundary-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2240-repair-intake-draft-to-case-http-envelope-boundary-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  'docs/task-2241-repair-intake-draft-to-case-full-boundary-runtime-hardening-final-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
]);

const PUBLIC_OPEN_ROUTE_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'public.routes',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

const BOUNDARY_SOURCE_PATHS = Object.freeze([
  ROUTE_PATH,
  'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  'src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
]);

const DB_TRANSACTION_PATTERNS = Object.freeze([
  /\bDATABASE_URL\b/,
  /\bprocess\.env\b/,
  /\bSELECT\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bBEGIN\b/i,
  /\bCOMMIT\b/i,
  /\bROLLBACK\b/i,
  /\.query\s*\(/,
  /\.execute\s*\(/,
  /\.transaction\s*\(/,
  /\brunInTransaction\s*\(/,
  /\bwithTransaction\s*\(/,
  /\bmigrations?\//i,
]);

const AUDIT_PERSISTENCE_PATTERNS = Object.freeze([
  /repair_intake_audit_events/i,
  /recordAuditEventToDb/i,
  /auditRepository/i,
  /audit persistence implementation/i,
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function assertPathExists(relativePath) {
  assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} contains ${marker}`);
  }
}

function stripConstCollection(source, constName) {
  const marker = `const ${constName}`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const arrayEnd = source.indexOf('];', start);
  const wrappedArrayEnd = source.indexOf(']);', start);
  const possibleEnds = [arrayEnd === -1 ? Infinity : arrayEnd + 2, wrappedArrayEnd === -1 ? Infinity : wrappedArrayEnd + 3];
  const end = Math.min(...possibleEnds);

  assert.notEqual(end, Infinity, `missing end for ${constName}`);

  return `${source.slice(0, start)}\n${source.slice(end)}`;
}

function sourceWithoutDenyLists(source) {
  return [
    'BODY_CONTEXT_FIELD_NAMES',
    'BODY_OVERRIDE_FIELD_NAMES',
    'UNSAFE_FIELD_NAMES',
    'UNSAFE_INPUT_FIELD_NAMES',
    'UNSAFE_OUTPUT_FIELD_NAMES',
    'UNSAFE_PUBLIC_VALUE_MARKERS',
    'UNSAFE_REQUEST_FIELD_NAMES',
    'UNSAFE_TEXT_MARKERS',
    'UNSAFE_TEXT_PATTERNS',
    'UNSAFE_VALUE_MARKERS',
  ].reduce((result, constName) => stripConstCollection(result, constName), source);
}

function repairIntakeControllerFiles() {
  const controllersPath = projectPath(CONTROLLERS_DIR);

  if (!fs.existsSync(controllersPath)) {
    return [];
  }

  return fs.readdirSync(controllersPath)
    .filter((entry) => /repair|intake/i.test(entry));
}

test('Task2242 static portfolio guard reads source test and doc files only', () => {
  for (const relativePath of [
    ...SOURCE_PATHS,
    ...GUARD_PATHS,
    ...CHECKPOINT_DOC_PATHS,
  ]) {
    assertPathExists(relativePath);
  }

  const ownSource = fs.readFileSync(__filename, 'utf8');
  const ownRequires = Array.from(ownSource.matchAll(/^\s*const\s+[^\n]+?=\s*require\(\s*['"]([^'"]+)['"]\s*\)/gm), (match) => match[1]);

  assert.deepEqual(ownRequires, [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('major accepted boundary guard portfolio remains present', () => {
  for (const relativePath of GUARD_PATHS) {
    const guardSource = read(relativePath);

    assert.equal(
      guardSource.includes('require('),
      true,
      `${relativePath} should remain a source-reading static guard artifact`,
    );
  }

  const finalCheckpoint = read('docs/task-2241-repair-intake-draft-to-case-full-boundary-runtime-hardening-final-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md');

  assertIncludesAll(finalCheckpoint, [
    'Task2187-Task2202',
    'Task2203-Task2210',
    'Task2211-Task2216',
    'Task2217-Task2225',
    'Task2226-Task2234',
    'Task2235-Task2240',
    'single resume point',
    'No future task is authorized by this checkpoint',
  ], 'Task2241 final checkpoint');
});

test('request trusted context command permission audit idempotency and correlation chain remains visible', () => {
  const requestContextResolver = read('src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js');
  const sanitizer = read('src/repairIntake/repairIntakePublicOpenRequestDtoSanitizer.js');
  const permissionGate = read('src/repairIntake/repairIntakeDraftToCasePermissionGate.js');
  const auditIntentBuilder = read('src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.js');
  const idempotencyPolicyBuilder = read('src/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder.js');
  const auditWriterPortAdapter = read('src/repairIntake/repairIntakeAuditWriterPortAdapter.js');

  assertIncludesAll(sanitizer, [
    'PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_ALLOWLIST',
    'sanitizeRepairIntakePublicOpenRequestDto',
  ], 'request DTO sanitizer');
  assertIncludesAll(requestContextResolver, [
    'sanitizeRepairIntakePublicOpenRequestDto',
    'const organizationId = safeString(sessionContext.organizationId)',
    'const actorId = safeString(sessionContext.actorId)',
    'const repairIntakeDraftId = safeString(safeInput.repairIntakeDraftId)',
    'delete draftInput.source',
  ], 'trusted request context resolver');
  assertIncludesAll(permissionGate, [
    'ALLOWED_ACTOR_ROLES',
    "'service_agent'",
    'ALLOWED_SOURCES',
    'decideRepairIntakeDraftToCasePermission',
    "deny('missing_trusted_context'",
    "deny('role_not_allowed'",
    "deny('invalid_source'",
  ], 'permission gate');
  assertIncludesAll(auditIntentBuilder, [
    'buildRepairIntakeDraftToCaseAuditIntent',
    'SUPPORTED_PHASES',
    'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_BUILT',
  ], 'permission-denial audit intent');
  assertIncludesAll(idempotencyPolicyBuilder, [
    'buildRepairIntakeDraftToCaseIdempotencyPolicy',
    'idempotencyScope',
    'requestId',
    'idempotencyKey',
  ], 'idempotency and correlation policy');
  assertIncludesAll(auditWriterPortAdapter, [
    'createRepairIntakeAuditWriterPortAdapter',
    'recordDraftToCaseDecision',
    'createAuditInput',
    'sanitizeValue(input)',
  ], 'safe audit context boundary');
});

test('application controller API route and HTTP fail-closed chain remains visible', () => {
  const applicationService = read('src/repairIntake/repairIntakeDraftToCaseApplicationService.js');
  const controllerAdapter = read('src/repairIntake/repairIntakeDraftCaseControllerAdapter.js');
  const apiModule = read('src/repairIntake/repairIntakeDraftToCaseApiModule.js');
  const routeAdapter = read('src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js');
  const routeHandler = read('src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js');
  const publicPresenter = read('src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js');
  const httpMapper = read('src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js');

  assertIncludesAll(applicationService, [
    'portMethodIsValid',
    'safeFailure',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED',
  ], 'application service injected-port boundary');
  assertIncludesAll(controllerAdapter, [
    'safeFailure',
    'sanitizeEnvelopeBody',
    'callService(method, input)',
    'CONTROLLER_APPLICATION_SERVICE_FAILED',
    'CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID',
  ], 'controller adapter failure boundary');
  assertIncludesAll(apiModule, [
    'safeControllerFailure',
    'sanitizeRequestInput(requestLike)',
    'sanitizeHandlerOutput',
    'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_OUTPUT_INVALID',
  ], 'API module safe-controller boundary');
  assertIncludesAll(routeAdapter, [
    'sanitizeRouteOutput',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_OUTPUT_INVALID',
  ], 'route adapter failure boundary');
  assertIncludesAll(routeHandler, [
    'sanitizeRouteOutput',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_OUTPUT_INVALID',
  ], 'route handler failure boundary');
  assertIncludesAll(publicPresenter, [
    'safeScalar(result.caseId)',
    'repairIntakeDraftId: safeDraftId(result)',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
  ], 'public success envelope allowlist');
  assertIncludesAll(httpMapper, [
    'PUBLIC_FIELD_NAMES',
    'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_RESULT_MAPPER_INVALID_RESULT',
    'if (!isPlainObject(publicResult))',
    'safeResult.ok === true && successStatus && (!messageKey || !reasonCode)',
    'caseId: safePublicString(safeResult.caseId)',
    'repairIntakeDraftId: safePublicString(safeResult.repairIntakeDraftId)',
  ], 'HTTP envelope mapper failure boundary');
});

test('current admin route status remains unchanged and non-public', () => {
  const routeSource = read(ROUTE_PATH);

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    "method: 'POST'",
    'registerRepairIntakeDraftToCaseAdminRoutes',
    'createExpressSubmitHandler(routeHandler)',
  ], 'admin route status');

  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'draft-to-case route file');
});

test('non-authorized public controller DB audit persistence and rollout boundaries remain visible', () => {
  assert.equal(fs.existsSync(projectPath(OPEN_REPAIR_INTAKE_SOURCE_DIR)), false, 'unexpected src/openRepairIntake directory');
  assert.equal(fs.existsSync(projectPath(OPEN_REPAIR_INTAKE_TEST_DIR)), false, 'unexpected tests/openRepairIntake directory');
  assert.deepEqual(repairIntakeControllerFiles(), []);

  for (const relativePath of BOUNDARY_SOURCE_PATHS) {
    const source = sourceWithoutDenyLists(read(relativePath));

    for (const pattern of [...DB_TRANSACTION_PATTERNS, ...AUDIT_PERSISTENCE_PATTERNS]) {
      assert.doesNotMatch(source, pattern, `${relativePath} contains non-authorized boundary marker ${pattern}`);
    }
  }

  const finalCheckpoint = read('docs/task-2241-repair-intake-draft-to-case-full-boundary-runtime-hardening-final-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md');

  assertIncludesAll(finalCheckpoint, [
    'No DB or repository transaction behavior is authorized',
    'No audit persistence behavior is authorized',
    'No public, open, or customer route expansion is authorized',
    'No smoke, endpoint probe, server/listener startup, shared runtime, deploy, staging, production, `/healthz`, or rollout work is authorized',
    'No provider sending is authorized',
    'No auth/session middleware change is authorized',
    'No rate-limit middleware change is authorized',
    'No payload-size/body-parser middleware change is authorized',
    'No package dependency change is authorized',
    'DB-backed repository transaction implementation packet',
    'Audit persistence implementation packet',
    'Migration/schema dry-run authorization packet',
    'Production auth/session implementation packet',
    'Rate-limit/payload-size implementation packet',
    'Smoke/staging rollout authorization packet',
    'Public/open Repair Intake path only if PM explicitly decides route scope',
  ], 'Task2241 non-authorized scope and candidates');
});
