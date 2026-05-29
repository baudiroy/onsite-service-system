# Task2137 - Customer Access Audit Persistence Runtime Integration Planning

## Status

- Created a docs-only planning packet for future Customer Access audit persistence runtime integration.
- This task does not change runtime behavior.
- This task does not execute DB commands, SQL, migration apply, or migration dry-run.
- This task does not use `psql`, `DATABASE_URL`, env, Zeabur, staging, production, or any DB connection.
- This task does not implement a repository or DB adapter.
- This task does not execute persistence.
- This task does not integrate runtime persistence.
- This task does not change source/runtime code, tests, package files, migration SQL files, routes/controllers/global mounts, production mount, app/server/public routes, smoke/server/listener/network code, provider/admin/AI/billing code, seed data, backfills, triggers, functions, or policies.
- The 7 held historical docs remain untracked and untouched.

## Baseline

- Branch: `main`.
- Starting HEAD/origin baseline: `4c8c7fe47e2982992b3ec1561c83b0a870018cf9`.
- `git status --short --branch` before work showed local `main...origin/main` and only the 7 held historical docs untracked.
- Task2136 was accepted, pushed, and synced.
- Customer Access audit persistence writer adapter skeleton is checkpointed.
- DB execution, DB changes, migration apply, migration dry-run, and runtime persistence integration remain not authorized.

## Future Dependency Chain

Future runtime persistence integration should preserve this chain:

1. Customer Access boundary emits sanitized `auditEvent`.
2. Existing Task2109 audit writer adapter invokes `function writer(auditEvent)`.
3. Persistence writer adapter builds sanitized repository record.
4. Explicit `auditRepository.recordCustomerAccessAuditEvent(record)` persists.
5. Repository result is normalized through the accepted normalizer.
6. Any failure returns failed/skipped audit result but does not affect customer response or route-registration summary.

The audit path must remain a side channel only.

## Future Integration Options

### Option A - Composition-Only Injection

- App composition injects persistence writer as `auditWriter`.
- Controllers, handlers, and routes remain unchanged.
- Existing optional `auditWriter` boundaries continue to own runtime calls.
- This is the recommended initial future direction.

Recommended initial future task:

- Option A composition-only.
- No controller or handler source changes if existing boundaries already support `auditWriter`.
- Synthetic repository only unless a separate repository task has been accepted.

### Option B - Route Registration Factory Dependency

- Route registration factory accepts `auditRepository` and internally composes `auditWriter`.
- Higher risk because route registration dependency surface expands.
- Should require separate PM approval and explicit tests if selected.

All options above are planning only and do not authorize implementation.

## Future Required Tests

Future implementation tasks should require:

- Existing case overview audit writer tests pass with persistence writer injected.
- Existing service-report audit writer tests pass with persistence writer injected.
- Route-registration audit writer tests pass with persistence writer injected.
- Repository receives sanitized record only.
- Repository failure does not alter customer response or registration summary.
- No audit result is customer-visible.
- No raw request/context/header/token/SQL/provider/debug/private data is passed to repository.
- No DB execution in unit tests; repository is synthetic test double only.

## Future Forbidden Boundaries

Future implementation must preserve:

- No DB execution unless separately authorized.
- No migration apply/dry-run unless separately authorized.
- No `DATABASE_URL`, env, or Zeabur access.
- No global DB pool.
- No direct repository import from controllers or handlers.
- No customer-visible audit endpoints.
- No admin audit UI.
- No provider/AI/billing side effects.

## Recommended Future Sequence - Candidates Only

All future tasks require separate PM authorization.

- Task A: Composition-only unit tests that inject persistence writer into existing `auditWriter` boundary using synthetic repository, no runtime source change if possible.
- Task B: Production composition readiness packet, no app/server mount.
- Task C: Disposable DB dry-run of migration `027` only if explicitly authorized.
- Task D: Real repository implementation after DB dry-run accepted.
- Task E: App composition injection after repository accepted.

## Current Non-Authorized Areas

- Source/runtime code changes remain not authorized.
- Test code changes remain not authorized.
- Package changes remain not authorized.
- DB execution remains not authorized.
- DB changes remain not authorized.
- Migration apply remains not authorized.
- Migration dry-run remains not authorized.
- `psql` remains not authorized.
- `DATABASE_URL` use remains not authorized.
- Env/Zeabur inspection remains not authorized.
- SQL execution remains not authorized.
- Repository implementation remains not authorized.
- DB adapter implementation remains not authorized.
- Runtime persistence integration remains not authorized.
- Route/controller/global mount changes remain not authorized.
- Production mount remains not authorized.
- App/server/public routes changes remain not authorized.
- Smoke/server/listener/network/provider/admin/AI/billing work remains not authorized.

## Verification

Static docs-only verification:

```sh
git diff --check -- docs/task-2137-customer-access-audit-persistence-runtime-integration-planning-no-runtime-change-no-db-no-persistence-execution.md
git status --short --branch
```

Results:

- `git diff --check -- docs/task-2137-customer-access-audit-persistence-runtime-integration-planning-no-runtime-change-no-db-no-persistence-execution.md`: PASS.
- `git status --short --branch`: branch `main...origin/main` with only this Task2137 doc and the 7 held historical docs untracked before commit.

Node tests were not required or run because Task2137 is docs-only and no source or test files were changed.
