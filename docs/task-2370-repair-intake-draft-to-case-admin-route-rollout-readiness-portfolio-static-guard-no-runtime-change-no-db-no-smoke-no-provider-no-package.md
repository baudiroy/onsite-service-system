# Task2370 Repair Intake Draft-to-Case Admin Route Rollout Readiness Portfolio Static Guard

## Scope

Task2370 adds a static portfolio guard that consolidates the Repair Intake draft-to-case admin route rollout readiness state after Task2368 and Task2369.

This is a no-runtime-change static guard task. It does not authorize DB execution, SQL execution, migration dry-run/apply, smoke tests, endpoint probes, env/Zeabur/secrets inspection, server/listener startup, deploy, shared runtime, staging/prod traffic, provider sending, package changes, route changes, or runtime/source behavior changes.

## Static rollout readiness portfolio coverage

The new guard reads source, test, and documentation text only. It freezes visibility of:

- Task2368 production readiness packet.
- Task2369 rollout authorization packet.
- Task2341 DB-backed fake/synthetic portfolio guard.
- Task2340 migration 026 dry-run blocked checkpoint.
- Task2363 admin route composition portfolio guard.
- Task2367 admin route composition synthetic verification branch closure.
- Current admin route file and API module request-abuse boundary.

## Accepted route readiness state

The portfolio remains source-only ready for a future authorization packet, but not authorized for rollout:

- Route path remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- Route remains admin/injected-only.
- `requirePermission` / `cases.create` remains visible.
- Auth/session context adapter and trusted context normalizer are wired at the route request-like boundary.
- Request abuse guard remains in the API module before controller invocation.
- Fake-router route composition passed.
- Auth-failure synthetic matrix passed.
- DB-backed fake/synthetic persistence chain with audit passed.

## Rollout blockers remain visible

- No disposable DB migration 026 dry-run completed.
- Migration 026 dry-run remains blocked due no disposable local/test DB tooling.
- No real DB/staging/prod DB authorization.
- No smoke/endpoint authorization.
- No production/staging env/Zeabur verification.
- Provider sending remains unauthorized.
- Public/open route remains unauthorized.

## Future rollout requirements remain visible

- Exact environment target must be named.
- DB target and migration state must be explicitly authorized.
- Secrets/env handling must forbid printing credentials or database URLs.
- Server/listener/deploy authorization must be explicit.
- Endpoint/smoke probes must be scoped.
- Stop conditions and rollback/revert requirements must be listed.

## Non-authorization statement

Task2370 keeps rollout non-authorized. It does not introduce:

- Endpoint/smoke/server command strings as executable authorization.
- Real-looking database URL or credential.
- `DATABASE_URL`, env, Zeabur, or secrets inspection.
- Provider sending.
- Package dependency expansion.
- Route path or mount change.
- Public/open/customer route expansion.

## Verification to complete

Task2370 must pass the PM-required source-reading verification set before commit and push:

- `node --test tests/repairIntake/repairIntakeDraftToCaseAdminRouteRolloutReadinessPortfolio.static.test.js`
- adjacent source-reading guards named by PM
- `npm run check`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`

## Held files

The 7 held historical docs remain outside Task2370 scope and must stay untracked, unstaged, and untouched.
