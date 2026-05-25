# Task 755 — Engineer Mobile Workbench Status Operation Shortcut Options / No DB

## Status

Completed.

## Scope

This task adds a small Engineer Mobile Workbench bootstrap shortcut for the generic task status operation provider. The existing runtime service already supports `statusOperationProvider`; this task wires the app factory and server bootstrap shortcut option to that existing injected-provider path.

## Changes

- Added `engineerMobileWorkbenchStatusOperationProvider` to `src/app.js`.
- Added `engineerMobileWorkbenchStatusOperationProvider` to `src/server.js`.
- Mapped the shortcut to nested Workbench `statusOperationProvider`.
- Added app factory coverage in `tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js`.
- Added server bootstrap coverage in `tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js`.
- Updated static source-boundary checks so the shortcut remains visible in app/server wiring tests.

## Runtime Contract

- The shortcut is injection-only.
- It does not create a default provider.
- It does not connect to DB.
- It does not change route paths, request shape, or response shape.
- Dedicated `engineerMobileWorkbench` options still take priority over top-level shortcuts.
- Existing operation-specific providers (`arrivedProvider`, `startedProvider`, `taskStatusProvider`) keep their existing runtime precedence inside the Workbench status operation service.

## Boundaries

- No DB connection.
- No DB migration.
- No schema or index change.
- No API shape change.
- No real provider implementation.
- No notification, LINE, SMS, App push, calendar, file upload, or offline sync behavior.
- No AI, RAG, vector, or external provider integration.
- No Field Service Report or `finalAppointmentId` mutation.
- No Billing / Settlement behavior change.
- No customer-visible data expansion.

## Verification

- `node --test tests/engineerMobileWorkbench/engineerMobileWorkbenchAppFactoryOptions.unit.test.js tests/engineerMobileWorkbench/engineerMobileWorkbenchServerOptions.unit.test.js` — PASS, 29 passed / 0 failed.
- `node --test tests/engineerMobileWorkbench/*.js` — PASS, 179 passed / 0 failed.
- `npm run check` — PASS.
- `find tests -type f -name '*.js' -print | xargs node --test` — PASS, 1707 passed / 0 failed.

## Notes

This keeps the Workbench bootstrap options symmetric with the underlying status-operation service while preserving the no-DB injected-provider boundary.
