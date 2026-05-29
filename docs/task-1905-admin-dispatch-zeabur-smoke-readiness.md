# Task1905 Admin Dispatch Zeabur Smoke Readiness

Status: readiness plan only. No smoke, DB, Zeabur probe, deploy, runtime start, migration, seed, or provider action was executed.

## Current Branch State

- Branch: `main`
- Last synchronized origin/main before Task1904/Task1905: `15d52f5c03e7b606549054fcd717e7e97771aaf9`
- Task1904 local commit: `de88e1e06bbf5c48e68f64d8a891979b8ba58a6e`
- Task1905 scope: documentation/readiness only
- Current expected local state after Task1905 commit: local `main` ahead of `origin/main` by Task1904 and Task1905 until PM acceptance and sync
- Seven held historical docs remain untracked and must stay untouched

## Existing Dispatch Runtime Boundary

- Admin dispatch assignment route boundary exists:
  - `PATCH /api/v1/admin/dispatch-assignments/:assignmentId/assignment-intent`
- The route mounts only when `assignmentService` is injected through `createAppRouter` options.
- The route uses `requirePermission('dispatch.manage')` before the service handler.
- The route/service/repository/guard/audit chain currently has no real DB smoke approval.

## Existing No-DB Building Blocks

- `DispatchAssignmentSqlRepositoryAdapter`
  - injected `dbClient` only
  - parameterized query specs
  - organization isolation through cases join/predicate
  - normalized/sanitized envelopes
- `DispatchAppointmentAssignmentService`
  - injected repository only
  - requires actor, organization, and dispatch permission context
  - fail-closed repository and organization mismatch handling
- `dispatchAssignment.routes`
  - injected assignment service only
  - optional route mounting
  - permission guard before service handler
- `AppointmentStatusTransitionGuard`
  - pure lifecycle transition guard
  - no route/DB/provider behavior
- `DispatchOrganizationIsolationContract`
  - pure route/service/repository organization isolation contract helper
- `AdminDispatchAuditBoundary`
  - injected audit writer only
  - internal-only sanitized audit events

## No Smoke Has Run

- No dispatch smoke was run.
- No Zeabur public endpoint was probed for dispatch smoke.
- No real DB connection was opened.
- No DB migration was run.
- No seed was run.
- No runtime server was started.
- No deploy was performed.
- No provider sending occurred.
- No secrets were printed.

## Preconditions Before Task1906

Before any Admin Dispatch smoke can run, Task1906 must explicitly name and approve:

- Exact target name.
- Exact target URL.
- Deployed commit confirmation.
- Whether the deployed runtime actually wires the injected assignment service.
- Auth/admin token handling method, without printing or pasting secrets into Codex chat.
- Whether the target is production, staging, or disposable test.
- DB target approval if any DB-backed route is in scope.
- Seed/test assignment data approval if needed.
- Confirmation that provider sending remains disabled.
- Confirmation that AI/billing provider execution remains disabled.
- Confirmation that Completion Report / Field Service Report behavior is out of scope.
- Confirmation that finalAppointmentId mutation remains forbidden.
- Confirmation that customer-visible publication behavior remains forbidden.

## Allowed Future Smoke Categories

Only after explicit Task1906 approval, the following categories may be considered:

- `/healthz`
- unauthenticated admin route safe-deny
- permission-denied safe-deny
- synthetic local handler only if explicitly scoped
- DB-backed assignment only after target and test data approval

## Forbidden Future Smoke Actions Without Explicit Approval

- Real assignment mutation.
- Appointment lifecycle mutation.
- finalAppointmentId mutation.
- Completion Report / Field Service Report behavior.
- Provider sending.
- AI provider calls.
- Billing provider calls.
- Customer-visible publication.
- Destructive fixture smoke.
- Seed or migration in the same task.
- Printing secrets, tokens, private keys, provider keys, `DATABASE_URL`, or `JWT_SECRET`.
- Using any target other than the explicitly named target.

## Required Task1906 Approval Phrase

Task1906 must include this exact approval pattern with a real target name:

> I approve running Admin Dispatch smoke against the explicitly named target: `<TARGET_NAME>`. Do not use any other target. Do not run DB/migration/seed unless separately approved. Do not mutate finalAppointmentId, trigger provider sending, AI, billing, Completion Report / FSR behavior, or customer-visible publication.

## Verification For This Readiness Task

Allowed verification only:

- `git diff --check`
- `find src -name '*.js' -print0 | xargs -0 -n1 node --check`
- `npm run check` if available

If `npm` is unavailable in the active shell, the syntax/static fallback is the documented replacement for this task.

## Guardrail Confirmation

- No DB / SQL / psql / migration / seed.
- No dispatch smoke.
- No Zeabur probes.
- No Zeabur env changes.
- No deploy.
- No runtime server start.
- No provider sending.
- No billing/AI execution.
- No secrets printed.
- No assignment or appointment mutation in real runtime.
- No finalAppointmentId mutation.
- No Completion Report / Field Service Report creation, approval, publication, revocation, or mutation.
- No customer-visible publication behavior.
