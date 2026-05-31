# Task2365 Repair Intake Draft-to-Case Admin Route Auth Failure Synthetic Matrix

## Scope

Task2365 adds focused synthetic tests for auth/session/permission failure cases on the existing Repair Intake draft-to-case admin route composition.

This task is test/docs only. It makes no runtime/source behavior changes.

## Modified files

- `tests/repairIntake/repairIntakeDraftToCaseAdminRouteAuthFailureSynthetic.unit.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseAdminRouteAuthFailureSyntheticBoundary.static.test.js`
- `docs/task-2365-repair-intake-draft-to-case-admin-route-auth-failure-synthetic-matrix-no-source-change-no-db-no-smoke-no-provider-no-package.md`

## Synthetic auth-failure matrix coverage

The new synthetic unit test uses fake router / fake request / fake response / fake injected runtime ports only and calls `registerRepairIntakeDraftToCaseAdminRoutes` directly.

The matrix covers:

- Missing authenticated user.
- Missing organization context.
- Missing actor identity.
- Missing or insufficient permission context.
- Client/body/query/header attempts to inject `organizationId`, `actorId`, role, and permission.
- Malformed auth/session context.
- Request abuse guard rejection before downstream controller/application ports.

## Safe failure assertions

The tests prove:

- Route path remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- Route remains admin/injected-only.
- `requirePermission` / `cases.create` remains represented.
- `requireAuth` / `requirePermission` middleware behavior is not changed.
- No downstream case creation, audit write, or runtime port execution occurs on auth/session/permission failure.
- Failure output remains generic/safe and does not expose raw auth/session/token/body/query/header/provider/debug/env fields.
- Request/body objects are not mutated.
- Request abuse guard rejection still occurs before downstream controller/application ports.

## Static guard coverage

The static boundary guard asserts:

- New synthetic auth-failure test exists.
- Fake router / fake injected runtime ports only.
- No server/listener/imported app startup.
- No endpoint/smoke behavior.
- No DB/env/Zeabur/secrets usage.
- No provider sending.
- No package dependency expansion.
- No route path/mount change.
- No public/open/customer route expansion.
- Request abuse guard remains downstream before controller invocation.

## Non-authorized scope preserved

Task2365 did not introduce:

- No runtime/source behavior changes.
- No route path or mount changes.
- No helper wiring changes.
- No package or package-lock changes.
- No auth/session middleware implementation changes.
- No `requireAuth` / `requirePermission` middleware behavior changes.
- No permission model changes, role expansion, or organization isolation source changes.
- No controller creation under `src/controllers/`.
- No public/open/customer route expansion.
- No changes under `src/openRepairIntake/` or `tests/openRepairIntake/`.
- No DB, env, Zeabur, or secrets usage.
- No DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.
- No `DATABASE_URL`, Zeabur, env, or secrets inspection.
- No repository, idempotency, case creator, draft reader, runtime factory, application service, or audit persistence behavior changes.
- No server/listener startup.
- No endpoint probes or smoke behavior.
- No shared runtime, deploy, staging/prod traffic, or `/healthz`.
- No provider sending.
- No AI/RAG/OpenAI/vector DB runtime behavior.
- No admin frontend, billing, settlement, payment, invoice, Customer Access, or Engineer Mobile runtime behavior changes.

## Verification completed

Required verification passed:

- `node --test tests/repairIntake/repairIntakeDraftToCaseAdminRouteAuthFailureSynthetic.unit.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseAdminRouteAuthFailureSyntheticBoundary.static.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSynthetic.unit.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionSyntheticBoundary.static.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseAdminRouteCompositionPortfolio.static.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseAuthSessionRouteWiringPortfolio.static.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionImplementationAuthorization.static.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseRequestAbuseGuardBoundary.static.test.js`: PASS
- `node --test tests/repairIntake/repairIntakeDraftToCaseProductionRouteExposureDecisionGate.static.test.js`: PASS
- `npm run check`: PASS
- `git diff --check`: PASS
- `git diff --cached --check`: PASS
- `git status --short --branch`: PASS with only Task2365 files plus the 7 held historical docs untracked before staging.

## Held files

The 7 held historical docs remain outside Task2365 scope and must stay untracked, unstaged, and untouched.
