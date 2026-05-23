# Task 632 — App Factory Customer Access Options Injection / No Shared DB / No Migration

## Summary

Task 632 adds a bounded app factory options slice for Customer Access wiring.

`src/app.js` now exports:

- `app`: the existing default app, created with no customer access options.
- `createApp(options)`: an app factory that can receive future app-level options.

The existing default `app` remains compatible with current `src/server.js` usage and preserves the no-options customer access safe-deny behavior.

## Customer Access Options Boundary

`createApp({ customerAccess })` passes the customer access option bag into Task 631 `createAppRouter({ customerAccess })`.

This creates an explicit future boundary for app/bootstrap wiring without requiring `src/app.js` to import a real DB singleton, pool, repository, transaction helper, provider, AI runtime, or audit writer.

The app factory does not call `dbClient` during app creation. Any injected DB client is only reachable through the downstream request execution path.

## Runtime Boundaries

Task 632 does not:

- Connect to a shared DB.
- Execute SQL against a real database.
- Add or apply a migration.
- Change schema or indexes.
- Modify `src/server.js`.
- Start an HTTP server.
- Import a real DB singleton, pool, transaction helper, provider, RAG/vector service, or AI runtime.
- Add provider sending, LINE push, SMS, email, app push, or audit writer runtime.
- Change DTO/projection behavior.
- Modify smoke tests or browser tests.

## Safety Behavior

The default app remains fail-closed for customer access.

For the explicit injected path:

- App factory creation with `dbClient` is side-effect-free.
- Synthetic all-allow DB rows can produce the customer-visible allow envelope.
- DB failures fail closed with generic `404 customerAccess.unavailable`.
- Internal fields, raw phone/address/LINE identifiers, tokens, secrets, and `finalAppointmentId` are not exposed from the DB-query path.
- Raw phone/address/LINE id alone does not authorize customer access.

## Future Server/Bootstrap Task Boundary

If a future task wires a real DB client from `src/server.js` or another bootstrap file into `createApp({ customerAccess })`, that task must explicitly name the exact bootstrap file, the read-only execution boundary, the test command, and whether it uses no shared DB or an approved disposable DB.

General "continue" or "go ahead" is not approval for shared DB access, DDL, migration apply, provider sending, or customer notification.

## Guardrails Preserved

Task 632 preserves:

- One Case = one formal Field Service Report.
- Customer-facing report = filtered publication view.
- LINE user id is not a global identity.
- Organization isolation.
- Data Access Control.
- No internal data leakage.
- No sensitive output.
- No migration or schema change.
