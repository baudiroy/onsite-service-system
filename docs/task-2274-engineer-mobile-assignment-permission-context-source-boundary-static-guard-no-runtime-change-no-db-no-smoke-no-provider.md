# Task2274 - Engineer Mobile Assignment Permission Context Source Boundary Static Guard

Status: implemented as static guard only

## Scope

This task adds a focused static guard for Engineer Mobile assignment, permission, and organization context source boundaries. It does not modify runtime/source behavior and does not change routes, DTOs, handlers, repositories, DB behavior, provider behavior, smoke behavior, or package files.

Added files:

- `tests/engineerMobile/engineerMobileAssignmentPermissionContextSourceBoundary.static.test.js`
- `docs/task-2274-engineer-mobile-assignment-permission-context-source-boundary-static-guard-no-runtime-change-no-db-no-smoke-no-provider.md`

## Static Guard Coverage

The static guard reads Engineer Mobile source, tests, and docs as text only. It does not import or execute runtime, DB, repository, provider, route, server, smoke, migration, AI/RAG, billing, package, or env code.

The guard freezes these current boundaries:

- Engineer Mobile assignment, permission, and organization context remain represented explicitly.
- Engineer Mobile access/action eligibility is not authorized by raw client-provided engineer IDs.
- Permission assignment guard auth sources remain explicit: `auth`, `permissionContext`, `actor`, and `context`.
- Permission assignment guard assignment sources remain explicit: `assignment`, `assignmentContext`, `taskScope`, and `task`.
- Permission assignment evaluation remains fail-closed for missing scope, missing permission, missing assignment, cross-organization assignment, and non-assigned engineer context.
- Task list request mapping keeps identity on `auth.organizationId` and `auth.engineerId`.
- Task detail request mapping keeps identity on auth and appointment selection on route params.
- Existing evidence continues to show body-provided organization and engineer IDs are ignored for task list request mapping.
- Visit-action policy registry keeps actor, appointment, and visit result as explicit evaluator inputs.
- Visit-action policies keep organization, permission, assigned engineer, and appointment state gates represented for each known action.
- Visit-action HTTP request normalization remains a subset normalizer and not an authorization source.
- Appointment ID mismatch remains explicitly denied by the request normalizer before action planning.

## Non-Runtime Confirmation

No runtime/source behavior was changed. No `src/` files were modified by this task.

No Engineer Mobile route/API/DTO/projection/handler/mobile behavior changed. No Workbench safe envelope helper wiring was added to any runtime path. No Customer Access or Repair Intake runtime behavior changed.

No DB command, SQL execution, SQL runtime construction, transaction implementation, migration, migration dry-run/apply, DATABASE_URL, Zeabur, env inspection, repository implementation behavior, audit persistence behavior, route path/mount, public/open route mounting, smoke, endpoint probe, server/listener startup, shared runtime, deploy, staging/prod traffic, provider sending, auth/session middleware, rate-limit middleware, payload-size/body-parser middleware, permission model, role expansion, organization isolation source behavior, AI/RAG/OpenAI/vector DB, admin frontend, billing, settlement, payment, invoice, or package dependency behavior changed.

The same 7 held historical docs remain untracked and untouched.

## Verification

Required verification:

- `node --test tests/engineerMobile/engineerMobileAssignmentPermissionContextSourceBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionEligibilityStateTransition.static.test.js`
- `node --test tests/engineerMobile/engineerMobileProjectionReadModelAllowlist.static.test.js`
- `node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionPolicyRegistryBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobileVisitActionCommandPlannerBoundary.static.test.js`
- `node --test tests/engineerMobile/engineerMobilePermissionAssignmentGuard.unit.test.js`
- `node --test tests/engineerMobile/engineerMobilePermissionAssignmentGuardClosure.static.test.js`
- `node --test tests/engineerMobile/engineerMobilePermissionRuntimeAdjacentBranchClosure.static.test.js`
- `git diff --check`
- `git diff --cached --check` if staged
- `git status --short --branch`
