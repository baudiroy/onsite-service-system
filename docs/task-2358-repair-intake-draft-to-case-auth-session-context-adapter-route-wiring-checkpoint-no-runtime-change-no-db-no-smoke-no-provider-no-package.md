# Task2358 Repair Intake Draft-to-Case Auth Session Context Adapter Route Wiring Checkpoint

## Scope

Task2358 is a docs-only checkpoint for the accepted Repair Intake draft-to-case auth session context adapter route wiring state.

No runtime, source, test, route path, route mount, helper wiring, package, package-lock, DB, migration, smoke, provider, env, Zeabur, secrets, endpoint, server/listener, deploy, shared runtime, admin frontend, billing, Customer Access, Engineer Mobile, or AI/RAG behavior changed.

## Accepted Outcomes Checkpoint

Task2354 inventoried production auth/session candidates and recommended adding a pure adapter helper before route wiring.

Task2355 added the pure auth/session context adapter helper and tests without route wiring.

Task2356 selected route request-like construction as the future adapter wiring boundary.

Task2357 wired `buildRepairIntakeDraftToCaseAuthSessionContext` into `buildAdminRequestLike(req)`.

## Current Runtime Status

The auth session context adapter helper exists at:

`src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter.js`

The helper export exists:

`buildRepairIntakeDraftToCaseAuthSessionContext`

The helper is wired only in:

`src/routes/repairIntakeDraftToCase.routes.js`

The selected boundary remains:

`buildAdminRequestLike(req)`

The auth adapter runs after body/server-owned context stripping and admin permission context creation.

The auth adapter `sessionContext` is passed into `normalizeRepairIntakeDraftToCaseTrustedContext`.

The route path is unchanged:

`POST /api/v1/admin/repair-intake/drafts/:draftId/case/submit`

The route remains admin/injected-only.

The permission gate remains `requirePermission / cases.create`.

`requireAuth` and `requirePermission` middleware behavior remains unchanged.

The API module request abuse guard remains downstream before controller invocation.

No package or package-lock changes are part of this checkpoint.

## Current Safety Status

The helper input is limited to server-owned `user`, `context`, `sessionContext`, `permissionContext`, `requestId`, and `idempotencyKey` values.

The helper input does not include raw body, `requestBody`, `draftInput`, query, header, cookie, client, provider, debug, env, DB, secrets, package, or runtime payloads.

On adapter success, adapter output becomes the trusted normalizer context/sessionContext.

On adapter failure, the route passes an empty safe context to the trusted normalizer, preserving fail-closed compatible request-like behavior.

Body/client override rejection remains covered by the accepted Task2357 route wiring tests and static guard.

No raw auth, session, token, body, or client data leaks into trusted context, body, actor, or params.

Input request/body objects are not mutated.

## Non-Authorized Next Candidates

Possible next Repair Intake tasks, not authorized by this checkpoint:

- auth/session route wiring static portfolio guard
- production route composition checkpoint
- production auth/session smoke/readiness packet only if PM explicitly chooses environment scope
- public/open Repair Intake route design only if PM explicitly chooses route scope
- wait for disposable DB tooling before retrying migration 026 dry-run

## Forbidden Scope Confirmation

Task2358 does not authorize:

- runtime/source/test behavior changes
- route path or mount changes
- helper wiring changes
- package or package-lock changes
- auth/session middleware implementation changes
- `requireAuth` or `requirePermission` middleware behavior changes
- permission model, role, or organization isolation source changes
- controller creation under `src/controllers/`
- public/open/customer route expansion
- changes under `src/openRepairIntake/` or `tests/openRepairIntake/`
- DB commands, SQL execution, real DB connection, migration creation, migration dry-run, or migration apply
- `DATABASE_URL`, Zeabur, env, or secrets inspection
- server/listener startup, smoke tests, endpoint probes, shared runtime, deploy, staging/prod traffic, or `/healthz`
- provider sending
- AI/RAG/OpenAI/vector DB runtime behavior
- admin frontend work
- billing, settlement, payment, or invoice behavior
- Customer Access or Engineer Mobile runtime behavior changes
- cleanup, staging, deletion, stash, reset, or revert of held historical docs

PM must still authorize one exact next task at a time.

## Held Docs

The same 7 held historical untracked docs remain outside Task2358 scope and must stay untouched unless PM explicitly authorizes that exact action.
