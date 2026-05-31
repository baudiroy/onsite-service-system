# Task2352 Repair Intake Draft-to-Case Auth Session Trusted Context Portfolio Static Guard

## Scope

Task2352 adds a focused static portfolio guard for the accepted Repair Intake draft-to-case auth/session and trusted-context readiness branch.

No runtime, source behavior, route path, route mount, helper wiring, permission model, auth/session middleware, package, package-lock, DB, migration, smoke, endpoint, server/listener, provider, env, Zeabur, secrets, repository, idempotency, case creator, draft reader, runtime factory, application service, audit persistence, Customer Access, Engineer Mobile, admin frontend, billing, or AI/RAG behavior changed.

The only test behavior changes are:

- adding the Task2352 source-reading static portfolio guard
- aligning the stale Task2222-era auth/session readiness static guard marker to the already accepted Task2350 route-boundary trusted-context normalizer wiring

## Modified Files

- `tests/repairIntake/repairIntakeDraftToCaseAuthSessionTrustedContextPortfolio.static.test.js`
- `tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js`
- `docs/task-2352-repair-intake-draft-to-case-auth-session-trusted-context-portfolio-static-guard-no-runtime-change-no-db-no-smoke-no-provider-no-package.md`

## Static Portfolio Coverage

The new portfolio guard verifies these accepted artifacts remain present and bounded:

- Task2344 auth/session context boundary inventory
- Task2345 trusted context normalizer contract guard
- Task2346 pure helper preflight design packet
- Task2347 pure trusted context normalizer helper implementation
- Task2348 route wiring decision gate
- Task2349 route wiring design packet
- Task2350 route boundary wiring implementation
- Task2351 route wiring checkpoint

It also verifies the current portfolio boundary:

- `src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer.js` exists
- `normalizeRepairIntakeDraftToCaseTrustedContext` remains exported
- helper is wired only in `src/routes/repairIntakeDraftToCase.routes.js`
- selected boundary remains `buildAdminRequestLike(req)`
- route path remains `POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`
- route remains admin/injected-only
- permission gate remains `requirePermission / cases.create`
- body/server-owned context stripping remains visible
- request abuse guard remains downstream before controller invocation
- no production auth/session middleware implementation is authorized
- no package or package-lock changes are required

## Safety Coverage

The portfolio guard records that:

- raw body, `requestBody`, `draftInput`, and client fields cannot override trusted context
- trusted organization, tenant, actor, draft, request, and idempotency context is normalized before controller/application flow
- missing or invalid trusted context has safe-failure coverage
- request-like output shape remains compatible
- input request/body objects are not mutated
- raw helper input and unsafe body/query/header/session/provider/debug/env/client fields are not exposed
- no public/open/customer route expansion markers are introduced
- `src/openRepairIntake/` and `tests/openRepairIntake/` remain absent

## Stale Adjacent Guard Repair

`tests/repairIntake/repairIntakeDraftToCaseProductionAuthSessionReadinessDecisionGate.static.test.js` was updated only to align its stale Task2222-era route request builder marker expectations with the accepted Task2350 architecture.

The aligned expectation now accepts that `buildAdminRequestLike(req)` resolves trusted context through `normalizeRepairIntakeDraftToCaseTrustedContext` at the route request-like construction boundary.

All existing non-authorization assertions remain preserved:

- no production auth/session middleware implementation
- no route path or mount change
- no public/open/customer route expansion
- no package dependency expansion
- no DB, migration, smoke, provider, or env coupling

## Forbidden Scope Confirmation

Task2352 does not authorize and did not perform:

- runtime/source behavior changes
- route path or mount changes
- helper wiring changes
- package or package-lock changes
- auth/session middleware implementation
- permission model changes, role expansion, or organization isolation source changes
- controller creation under `src/controllers/`
- public/open/customer route expansion
- changes under `src/openRepairIntake/` or `tests/openRepairIntake/`
- DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- repository, idempotency, case creator, draft reader, runtime factory, application service, or audit persistence behavior changes
- server/listener startup, smoke tests, endpoint probes, shared runtime, deploy, staging/prod traffic, or `/healthz`
- provider sending
- AI/RAG/OpenAI/vector DB runtime behavior
- admin frontend work
- billing, settlement, payment, or invoice behavior
- Customer Access or Engineer Mobile runtime behavior changes
- cleanup, staging, deletion, stash, reset, or revert of held historical docs

## Future Work Not Authorized

Possible next work remains non-authorized until PM grants one exact task:

- production auth/session packet
- source-only production route composition checkpoint
- public/open Repair Intake route design
- migration 026 dry-run after disposable DB tooling is available

PM must still authorize one exact task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2352 scope and must stay untouched unless PM explicitly authorizes that exact action.
