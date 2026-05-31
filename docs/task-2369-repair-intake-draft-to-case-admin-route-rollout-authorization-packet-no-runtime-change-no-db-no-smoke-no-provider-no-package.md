# Task2369 Repair Intake Draft-to-Case Admin Route Rollout Authorization Packet

## Scope

Task2369 adds a route rollout authorization packet and source-reading static guard for the existing Repair Intake draft-to-case admin route.

This is docs/static-only. It does not authorize server/listener startup, smoke execution, endpoint probes, env/Zeabur/secrets inspection, DB execution, SQL execution, migration creation, migration dry-run/apply, provider sending, deploy, package changes, or runtime/source behavior changes.

## Current accepted route readiness

- Route path remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`.
- Route remains admin/injected-only.
- `requirePermission` / `cases.create` remains present.
- Auth/session context adapter and trusted context normalizer are wired at the route request-like boundary.
- Request abuse guard is in the API module before controller invocation.
- Fake-router route composition passed.
- Auth-failure synthetic matrix passed.
- DB-backed fake/synthetic persistence chain with audit passed.
- Migration 026 dry-run remains blocked due no disposable local/test DB tooling.

## Future rollout blockers

- No disposable DB migration 026 dry-run completed.
- No real DB/staging/prod DB authorization.
- No smoke/endpoint authorization.
- No production/staging env/Zeabur verification.
- Provider sending remains unauthorized.
- Public/open route remains unauthorized.

## Future rollout authorization requirements

Any future rollout, staging validation, production validation, or smoke packet must receive separate exact PM authorization and must define:

- Exact environment target by name.
- DB target and migration state explicitly authorized.
- Secrets/env handling plan that forbids printing credentials, database URLs, or secret values.
- Server/listener/deploy authorization, if needed, as an explicit scope item.
- Endpoint/smoke probes explicitly scoped by method, path, auth/session source, fixture, and expected safe envelope.
- Expected success response: safe status, `ok: true`, submitted action, non-secret case reference, organization/draft identifiers scoped to the authorized fixture, and no raw internal payload.
- Expected safe failure response: safe status, `ok: false`, generic `reasonCode` or message key, required actions when applicable, and no raw error, stack, request, credential, provider, DB, or customer-private payload.
- Stop conditions.
- Rollback/revert plan.
- Provider sending disabled unless separately authorized.

## Stop conditions

Future rollout or smoke work must stop before execution or immediately halt if any of these appear:

- Environment target ambiguity.
- DB/migration state ambiguity.
- Missing auth/session context.
- Permission failure ambiguity.
- Unexpected route path/mount behavior.
- Any need to print secrets or `DATABASE_URL`.
- Any provider sending requirement.
- Any production/staging traffic not explicitly authorized.

## Rollback and revert requirements

Future runtime rollout authorization must include a rollback/revert plan before execution. At minimum, that plan must state:

- Which branch, commit, or deployment artifact can be restored.
- Which feature flag or route enablement setting can be disabled.
- How DB migration state will be handled if migration work is authorized separately.
- Who confirms rollback completion.
- Which evidence can be collected without printing secrets.

## Recommended next bounded task

Recommended next exact bounded task: production rollout static readiness portfolio guard.

Reason: Task2369 defines the authorization requirements and stop conditions, but rollout is still blocked by missing disposable DB migration 026 dry-run, missing environment authorization, and missing smoke/endpoint authorization. A static readiness portfolio guard can consolidate the accepted readiness, blockers, and authorization requirements without executing runtime work.

Do not recommend immediate smoke execution unless all blockers are explicitly satisfied by a separate PM-authorized task.

## Static guard coverage

The static guard asserts:

- This packet exists.
- Route path/admin/injected/permission markers remain visible.
- Auth/session route wiring markers remain visible.
- Request abuse guard marker remains visible.
- Production rollout remains non-authorized.
- DB/migration/smoke/env/provider work remains non-authorized.
- Migration 026 dry-run blocked status remains visible.
- This packet contains stop conditions.
- This packet contains rollback/revert requirements.
- No endpoint/smoke/server command strings are introduced as executable authorization.
- No real-looking database URL or credential appears.

## Non-authorized scope preserved

Task2369 does not introduce:

- Runtime/source behavior changes.
- Route path or mount changes.
- Helper wiring changes.
- Package or package-lock changes.
- Auth/session middleware implementation changes.
- `requireAuth` / `requirePermission` middleware behavior changes.
- Permission model changes, role expansion, or organization isolation source changes.
- Controller creation under `src/controllers/`.
- Public/open/customer route expansion.
- Changes under `src/openRepairIntake/` or `tests/openRepairIntake/`.
- DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply.
- `DATABASE_URL`, Zeabur, env, or secrets inspection.
- Repository, idempotency, case creator, draft reader, runtime factory, application service, or audit persistence behavior changes.
- Server/listener startup.
- Smoke test execution.
- Endpoint probes.
- Shared runtime, deploy, staging/prod traffic, or health checks.
- Provider sending.
- AI/RAG/OpenAI/vector DB runtime behavior.
- Admin frontend behavior.
- Billing/settlement/payment/invoice behavior.
- Customer Access runtime behavior changes.
- Engineer Mobile runtime behavior changes.

## Verification to complete

Task2369 must pass the required PM verification list before commit and push:

- `node --test tests/repairIntake/repairIntakeDraftToCaseAdminRouteRolloutAuthorizationPacket.static.test.js`
- adjacent source-reading guards named by PM
- `npm run check`
- `git diff --check`
- `git diff --cached --check`
- `git status --short --branch`

## Held files

The 7 held historical docs remain outside Task2369 scope and must stay untracked, unstaged, and untouched.
