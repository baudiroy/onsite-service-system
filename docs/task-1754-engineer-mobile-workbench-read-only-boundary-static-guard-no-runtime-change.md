# Task1754 - Engineer Mobile Workbench Read-Only Boundary Static Guard / No Runtime Change

Status: completed

## Scope

Task1754 adds a static boundary guard for the accepted Engineer Mobile Workbench read-only runtime branch after Tasks1735-1753.

Allowed files:

- `tests/engineerMobile/engineerMobileWorkbenchReadOnlyBoundary.static.test.js`
- `docs/task-1754-engineer-mobile-workbench-read-only-boundary-static-guard-no-runtime-change.md`

Runtime source was not modified.

## Guarded Source Files

The new static guard reads these accepted read-only source files:

- `src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentProjection.js`
- `src/engineerMobile/engineerMobileWorkbenchSafeEnvelope.js`
- `src/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.js`
- `src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js`
- `src/engineerMobile/engineerMobileWorkbenchRequestContextResolver.js`
- `src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.js`

## What The Static Guard Checks

The guard fails if the monitored source files directly import or call forbidden runtime surfaces:

- global app / server / route modules
- migrations or package files
- DB clients, pools, SQL execution, `psql`, or `db:migrate`
- `listen`, server start, or HTTP server bootstrap
- provider sending, LINE, SMS, email, webhook, or push senders
- OpenAI / AI / RAG / vector DB runtime
- billing / settlement runtime
- admin UI runtime
- Field Service Report / Completion Report creation, update, submit, publish, or completion mutation calls
- appointment or case mutation calls

The guard also confirms positive boundary facts:

- canonical injected routes remain `/engineer-mobile/appointments` and `/engineer-mobile/appointments/:appointmentId`
- internal alias route strings remain local to the read-only adapter boundary
- repository guard remains injected delegate only
- request context resolver remains injected request only
- projection remains allowlist-oriented
- safe envelope helper remains sanitizer-oriented and strips sensitive fields including raw errors, SQL, DB rows, tokens, cookies, passwords, secrets, authorization, raw session/user, provider debug, internal notes, and `finalAppointmentId`

## Non-goals

- No source/runtime changes
- No DB
- No migration
- No `psql`
- No `db:migrate`
- No smoke
- No global route mount
- No provider sending
- No LINE / SMS / email / webhook
- No AI / RAG
- No billing / settlement
- No admin UI
- No package changes
- No staging / commit / push in this task
- No cleanup of held historical docs

## Verification

Commands run:

```bash
node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyBoundary.static.test.js
node --test tests/engineerMobile/engineerMobileWorkbenchReadOnlyBoundary.static.test.js tests/engineerMobile/engineerMobileWorkbenchSafeEnvelope.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentProjection.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentsHandler.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.unit.test.js tests/engineerMobile/engineerMobileWorkbenchReadOnlyModule.unit.test.js tests/engineerMobile/engineerMobileWorkbenchRequestContextResolver.unit.test.js tests/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.unit.test.js
npm run check
git diff --check -- tests/engineerMobile/engineerMobileWorkbenchReadOnlyBoundary.static.test.js docs/task-1754-engineer-mobile-workbench-read-only-boundary-static-guard-no-runtime-change.md
```

Results:

- Boundary static test: PASS, 6 tests.
- Engineer Mobile read-only set with the new boundary static test: PASS, 91 tests.
- `npm run check`: PASS.
- `git diff --check`: PASS.
- Credential scan on Task1754 changed files: clean.
