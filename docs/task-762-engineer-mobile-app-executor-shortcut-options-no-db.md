# Task 762 - Engineer Mobile App Executor Shortcut Options / No DB

## Status

Completed.

## Scope

Runtime app factory wiring and targeted tests only.

This task adds top-level Engineer Mobile read executor shortcut support to `createApp(...)`, matching the existing request-aware read-provider composition path without adding DB connections, migrations, provider sending, AI, RAG, LINE, SMS, email, push, or secret-handling behavior.

## Changes

- Added app factory support for Engineer Mobile read executor shortcut options:
  - `engineerMobileReadExecutor`
  - `engineerMobileQueryExecutor`
  - `engineerMobileReadQueryExecutor`
  - `engineerMobileListExecutor`
  - `engineerMobileReadListExecutor`
  - `engineerMobileDetailExecutor`
  - `engineerMobileReadDetailExecutor`
- Preserved option priority:
  - explicit nested `engineerMobile` options win over all shortcuts.
  - `engineerMobileReadRepository` wins over executor shortcuts.
  - executor shortcuts are used only when no nested options or repository shortcut is present.
- Added app factory tests for executor shortcut wiring, deferred executor invocation, safe scoped output, and priority behavior.

## Contract

- The executor shortcut is only an injected read source.
- App bootstrap does not create a real DB client or import a real DB pool.
- The shortcut composes request-aware Engineer Mobile read options through existing mapper/repository/provider boundaries.
- Existing server executor shortcut behavior remains unchanged.
- No API shape, route path, DB schema, migration, permission model, audit runtime, notification runtime, or AI behavior was changed.

## Guardrails

- Engineer Mobile task output remains organization and assigned-engineer scoped.
- Forbidden internal, raw identity, billing, settlement, token, secret, and `finalAppointmentId` fields remain excluded by existing mapper/service behavior.
- No Case / Appointment / Field Service Report mutation behavior changed.
- No LINE / SMS / App push / AI / RAG behavior was added.
- No DB connection, migration, dry-run, or shared runtime action was executed.

## Verification

- `node --test tests/engineerMobile/engineerMobileAppFactoryOptions.unit.test.js tests/engineerMobile/engineerMobileServerOptions.unit.test.js`
  - PASS, 25 passed / 0 failed.

Further full project checks were run in the task close-out sequence.
