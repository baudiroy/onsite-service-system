# Task 761 - Engineer Mobile Read Repository Shortcut Options / No DB

## Status

Completed.

## Scope

Runtime bootstrap wiring and targeted tests only.

This task adds a small Engineer Mobile read wiring shortcut so tests and future runtime composition can inject an already-constructed read repository without importing DB, repository factories, providers, notification senders, AI, RAG, LINE, SMS, email, push, or migration logic in app/server bootstrap.

## Changes

- Added `engineerMobileReadRepository` shortcut support in `src/app.js`.
- Added `engineerMobileReadRepository` shortcut support in `src/server.js`.
- Preserved explicit nested `engineerMobile` option priority over shortcut options.
- Preserved repository shortcut priority over executor shortcuts in server bootstrap.
- Added app/server option tests for repository shortcut wiring, deferred repository invocation, scoped safe output, and priority behavior.

## Contract

- `engineerMobileReadRepository` is an injected object. App/server do not construct a DB-backed repository.
- The shortcut is converted to request-aware Engineer Mobile options:
  - `repository`
  - `useRequestAwareProvider: true`
- Existing nested `engineerMobile` options remain the owner when present.
- Existing executor shortcut options remain supported.
- No API shape, route path, DB schema, migration, permission model, audit runtime, notification runtime, or AI behavior was changed.

## Guardrails

- One Case = one formal completion report remains unchanged.
- Multiple appointments / dispatch visits per Case remain unchanged.
- Engineer Mobile read output remains assigned-engineer and organization scoped.
- Customer-visible and engineer-visible response data remains redacted through existing Engineer Mobile service mapping.
- No `finalAppointmentId` is exposed to Engineer Mobile task output.
- No LINE / SMS / App push / AI / RAG behavior was added.
- No DB connection, migration, dry-run, or shared runtime action was executed.

## Verification

- `node --test tests/engineerMobile/engineerMobileAppFactoryOptions.unit.test.js tests/engineerMobile/engineerMobileServerOptions.unit.test.js`
  - PASS, 22 passed / 0 failed.
- `node --test tests/engineerMobile/*.js`
  - PASS, 407 passed / 0 failed.

Further full project checks were run in the task close-out sequence.
