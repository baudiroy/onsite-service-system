# Task2224 Repair Intake Draft-to-Case Smoke Staging Rollout Authorization Gate

## Scope

- Adds this no-runtime-change smoke/staging/production rollout authorization gate for the Repair Intake draft-to-case admin route.
- Adds a focused static guard for the current rollout authorization boundary.
- Does not execute smoke tests, endpoint probes, server/listener startup, shared runtime, staging traffic, production traffic, deploys, Zeabur/env/secrets inspection, DB commands, provider sending, or production rollout.
- Does not authorize Task2225 or any future task.

## Current Rollout Authorization Boundary

- Current route remains admin/injected-only.
- Current route remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- Current route remains permission-gated by `requirePermission` / `cases.create`.
- No public/open/customer route expansion is authorized by this task.
- Task2224 does not authorize smoke tests, endpoint probes, server/listener startup, shared runtime, health endpoint checks, staging/prod traffic, deploys, Zeabur/env/secrets inspection, DB commands, provider sending, or production rollout.
- Any future smoke/staging/prod validation requires a separate exact PM-authorized task.
- A future rollout task must specify target environment, allowed endpoints, auth/session source, fixture data, expected safe envelopes, rollback plan, and stop conditions.

## Future Decisions Required Before Smoke Staging Production Rollout

- Local synthetic-only vs staging vs production target.
- Endpoint path and method.
- Auth/session/permission source.
- Organization/tenant fixture and draft id fixture.
- DB/repository readiness and migration status.
- Audit persistence expectation.
- Provider/notification non-goals.
- Rate limiting/payload size policy status.
- Safe response assertions.
- Rollback/stop conditions.

## Static Guard Coverage

- `tests/repairIntake/repairIntakeDraftToCaseSmokeStagingRolloutAuthorizationGate.static.test.js` reads source files only.
- The guard asserts the route remains admin-scoped and permission-gated.
- The guard asserts no public/open/customer route markers exist in the draft-to-case route file.
- The guard asserts no runtime, endpoint probe, deploy, Zeabur/env/secrets, DB, or provider command imports are added by the Task2224 static guard.
- The guard asserts the Task2224 test uses only Node core source-reading modules and does not start runtime or hit endpoints.
- The guard asserts this document records future rollout decisions as non-authorized.

## Runtime Authorization Boundary

Task2224 does not authorize Task2225, smoke test execution, endpoint probes, server/listener startup, shared runtime, health endpoint checks, staging or production traffic, deploys, Zeabur/env/secrets inspection, DB commands, SQL execution, SQL runtime construction, transaction implementation, migrations, provider sending, route changes, rate limiting middleware, payload-size/body-parser middleware, auth/session middleware, JWT/OAuth/session provider integration, permission model changes, role expansion, organization isolation source changes, public/open/customer route exposure, repository implementation changes, audit persistence, AI/RAG/OpenAI/vector DB, admin frontend, billing/settlement/payment/invoice, Customer Access, Engineer Mobile, package dependency changes, or any future task. PM must authorize one exact task at a time.
