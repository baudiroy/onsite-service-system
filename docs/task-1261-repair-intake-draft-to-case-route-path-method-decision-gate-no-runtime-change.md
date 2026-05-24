# Task1261 - Repair Intake Draft-to-Case Route Path Method Decision Gate / No Runtime Change

Status: local decision gate ready for PM review.

## Scope

Task1261 records the exact proposed route method and path for a future real route approval step.

This is docs-only and static-guard only. It does not implement, register, or mount a route.

Current latest commit at the start of this decision gate:

- `23e54b9 Add repair intake draft-to-case route adapter composition test`

## Current Implemented Non-Mounted Chain

The current committed chain is framework-neutral and non-mounted:

- route adapter contract
- pre-route handler factory
- context resolver
- idempotency policy builder
- audit intent builder
- synthetic handler
- HTTP result mapper
- repository / application / orchestrator stack

## Proposed Future Route

`POST /internal/repair-intake/drafts/:repairIntakeDraftId/submit-to-case`

Rationale:

- `internal` because this route is not customer-facing.
- `repair-intake/drafts/:repairIntakeDraftId` because formal Case creation starts from a Repair Intake draft.
- `submit-to-case` because the operation transitions a draft into the formal Case creation path.
- `POST` because this is a state-changing action.
- `repairIntakeDraftId` must come from the path in the future route, but Task1261 does not implement path parsing.

## Required Future Behavior Before Route Mount

Before any real route mount, PM must explicitly approve:

- real auth/session context source injection
- real permission resolver enforcing organization isolation
- path `repairIntakeDraftId` reconciliation with body value, or body value forbidden
- idempotency header source
- request ID header source
- audit persistence source
- DB-backed repository verification
- smoke scope

## No-Go For Task1261

- no route file creation
- no controller file creation
- no app/server mount
- no Express/Fastify/Koa request/response object
- no DB/cache/audit persistence
- no provider/AI/billing/customer-visible runtime
- no auth/JWT/token parsing
- no `src/app.js` modification
- no `src/server.js` modification
- no `src/routes/**` modification
- no `src/controllers/**` modification
- no `src/db/**` modification
- no `migrations/**` modification
- no `admin/**` modification
- no `package.json` or `package-lock.json` modification

## Boundary

Task1261 only records the proposed method/path decision for PM review.

It does not create a route file, controller file, framework request adapter, server registration, database connection, cache write, audit persistence, idempotency store, provider call, AI/RAG call, billing/settlement runtime, customer-visible runtime, auth parser, JWT verifier, migration, or smoke execution.

Future real route work still requires a separate bounded PM task with exact allowlist, route integration file, path parser behavior, auth/session source, permission resolver source, persistence boundaries, DB verification, and smoke scope.

## Verification

Required by PM:

- `node --test tests/repairIntake/repairIntakeDraftToCaseRoutePathMethodDecisionGate.static.test.js`
- `git diff --check`
- `git diff --cached --check`
- `git diff --cached --name-only`
- `git diff --name-only`
- `git log -1 --oneline`

Expected:

- Static test passes.
- Diff checks pass.
- Staged area remains empty.
- Latest commit remains `23e54b9 Add repair intake draft-to-case route adapter composition test`.
- Historical dirty tracked files remain unstaged and untouched.
- Task1261 files may remain untracked.
