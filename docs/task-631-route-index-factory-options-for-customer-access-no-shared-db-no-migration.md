# Task 631 — Route Index Factory Options for Customer Access / No Shared DB / No Migration

## Summary

Task 631 adds a bounded route-index factory slice for Customer Access wiring.

`src/routes/index.js` now exports:

- `router`: the existing no-options central router.
- `createAppRouter(options)`: a factory that can receive future route options.

The existing exported `router` is still created without options and therefore preserves the current customer access safe-deny default.

## Customer Access Options Boundary

`createAppRouter({ customerAccess })` passes explicit customer access options into the customer access route registration path.

This enables future app/bootstrap work to inject customer access dependencies explicitly, for example a customer access DB adapter or DB client, without requiring route index to import a real DB singleton.

The factory does not call `dbClient` during route creation. Any injected DB client is only reachable through the downstream request execution path.

## Runtime Boundaries

Task 631 does not:

- Connect to a shared DB.
- Execute SQL against a real database.
- Add or apply a migration.
- Change schema or indexes.
- Change app/server bootstrap.
- Import a real DB singleton, transaction helper, provider, RAG/vector service, or AI runtime.
- Add provider sending, LINE push, SMS, email, app push, or audit writer runtime.
- Change DTO/projection behavior.
- Modify smoke tests or browser tests.

## Safety Behavior

The no-options central router remains fail-closed for customer access.

For the explicit injected path:

- Factory creation with `dbClient` is side-effect-free.
- Synthetic all-allow DB rows can produce the customer-visible allow envelope.
- DB failures fail closed with generic `404 customerAccess.unavailable`.
- Internal fields, raw phone/address/LINE identifiers, tokens, secrets, and `finalAppointmentId` are not exposed from the DB-query path.
- Raw phone/address/LINE id alone does not authorize customer access.

## Future App/Bootstrap Task Boundary

If a future task wires a real DB client from app/bootstrap into `createAppRouter({ customerAccess })`, that task must explicitly name the exact app/bootstrap file, the read-only execution boundary, the test command, and whether it uses no shared DB or an approved disposable DB.

General "continue" or "go ahead" is not approval for shared DB access, DDL, migration apply, provider sending, or customer notification.

## Guardrails Preserved

Task 631 preserves:

- One Case = one formal Field Service Report.
- Customer-facing report = filtered publication view.
- LINE user id is not a global identity.
- Organization isolation.
- Data Access Control.
- No internal data leakage.
- No sensitive output.
- No migration or schema change.
